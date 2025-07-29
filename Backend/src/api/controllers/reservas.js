import { CALENDARS, BUSINESS_HOURS, RESERVATION_DURATION_MINUTES } from '../../config/calendars.js'
import { GoogleCalendarService } from '../../api/services/googleCalendar.js'
import { enviarMensajeWhatsApp } from '../../api/services/builderBot.js'
import { shortenUrl } from '../../api/services/acortarURL.js' // No se usa por el momento, no permite acortar rutas de "Localhost"
import { CLUB_ID, DOMINIO_FRONTEND } from '../../config/config.js'
import { ReservasModel } from '../../models/reservas.js'
import { JugadoresModel } from '../../models/jugadores.js'
import { NODE_ENV } from '../../config/config.js'
import { ClubsModel } from '../../models/clubs.js';

export class ReservasController {

    // Modificar la función obtenerDetallesReserva en reservas.js
    static async obtenerDetallesReserva(req, res) {
        try {
            const { eventId, calendarId } = req.query;

            // Validación básica
            if (!eventId || !calendarId) {
                return res.status(400).json({
                    status: "error",
                    message: "Los parámetros eventId y calendarId son obligatorios."
                });
            }

            // Obtener evento desde Google Calendar
            const evento = await GoogleCalendarService.getEvent(calendarId, eventId);

            if (!evento) {
                return res.status(404).json({
                    status: "error",
                    message: "No se encontró la reserva solicitada."
                });
            }

            // Extraer información relevante del evento
            const descripcion = evento.description || "";

            // Extraer información del evento
            const infoMap = {};
            descripcion.split('\n').forEach(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':', 2);
                    infoMap[key.trim()] = value.trim();
                }
            });

            // Extraer información de jugadores
            const jugadores = [];
            const organizadorNombre = infoMap['Jugador Principal'] || '';

            // Añadir organizador como Jugador 1
            if (organizadorNombre) {
                jugadores.push({
                    nombre: organizadorNombre,
                    posicion: 1,
                    telefono: infoMap['Teléfono'] || '',
                    esOrganizador: true
                });
            }

            // Añadir jugadores 2, 3 y 4
            for (let i = 2; i <= 4; i++) {
                const nombreJugador = infoMap[`Jugador ${i}`] || '';
                if (nombreJugador && nombreJugador.trim() !== '') {
                    jugadores.push({
                        nombre: nombreJugador,
                        posicion: i,
                        telefono: infoMap[`Telefono ${i}`] || '',
                        esOrganizador: false
                    });
                }
            }

            // Crear objeto de reserva con los datos formateados
            const reserva = {
                id: evento.id,
                titulo: evento.summary,
                inicio: evento.start.dateTime,
                fin: evento.end.dateTime,
                pista: infoMap['Pista'] || '',
                nivel: infoMap['Nivel'] || '',
                organizador: infoMap['Jugador Principal'] || '',
                jugadores_actuales: infoMap['Nº Actuales'] || '0',
                jugadores_faltan: infoMap['Nº Faltantes'] || '0',
                idPartida: infoMap['ID'] || '',
                colorId: evento.colorId || '0',
                // Añadir campos para jugadores
                jugadores: jugadores,
                // También incluir campos individuales para compatibilidad
                jugador1: infoMap['Jugador Principal'] || '',
                jugador2: infoMap['Jugador 2'] || '',
                jugador3: infoMap['Jugador 3'] || '',
                jugador4: infoMap['Jugador 4'] || '',
                descripcion_completa: descripcion // Incluir la descripción completa
            };

            // Devolver los datos formateados
            return res.json({
                status: "success",
                reserva
            });
        } catch (error) {
            console.error("Error al obtener detalles de reserva:", error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Error al obtener detalles de la reserva"
            });
        }
    }

    static async agendar(req, res) {
        try {
            const { fecha_ISO, nombre, numero, partida, nivel, jugadores_faltan } = req.body;

            // Validación básica
            if (!fecha_ISO || !nombre || !numero) {
                return res.status(400).json({
                    status: "error",
                    message: "Los campos 'fecha_ISO', 'nombre' y 'numero' son obligatorios."
                });
            }

            // Parsear fecha_ISO y validar
            const startDate = new Date(fecha_ISO);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    status: "error",
                    message: "La fecha_ISO proporcionada no es válida."
                });
            }

            // 1. Buscar slot exacto en la pista solicitada
            const slotInfo = await buscarSlotDisponibleExacto(startDate);
            if (slotInfo && slotInfo.disponible) {
                // Generar enlace de confirmación para ese slot
                const reservaPayload = {
                    pista: slotInfo.pista.name,
                    inicio: slotInfo.slotInicio.toISOString(),
                    fin: slotInfo.slotFin.toISOString(),
                    nombre,
                    numero,
                    partida,
                    nivel,
                    jugadores_faltan
                };

                const urlReserva = `${DOMINIO_FRONTEND}/confirmar-reserva?data=${encodeURIComponent(JSON.stringify(reservaPayload))}`;


                const enlace = await shortenUrl(urlReserva);


                // const mensaje = `✅ Hay disponibilidad para reservar el ${slotInfo.pista.name} el ${slotInfo.slotInicio.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}.\n\n[Haz clic aquí para confirmar la reserva](${enlace})`;
                // await enviarMensajeWhatsApp(mensaje, numero);

                await enviarMensajeWhatsApp('reservas.disponibilidad.disponible', numero, {
                    pista: slotInfo.pista.name,
                    fecha: slotInfo.slotInicio.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
                    enlace: enlace
                });

                return res.json({
                    status: "enlace_confirmacion",
                    message: "Mensaje enviado con enlace de confirmación",
                    enlace
                });
            }

            // 2. Buscar alternativas en el MISMO horario pero en otras pistas
            const alternativasMismoHorario = await buscarAlternativasMismoHorario(startDate, nombre, numero, partida, nivel, jugadores_faltan);
            if (alternativasMismoHorario.length > 0) {
                // Formatear cada horario con traducción individual
                const listaHorarios = await Promise.all(alternativasMismoHorario.map(async horario => {
                    const inicio = new Date(horario.inicio);
                    const fin = new Date(horario.fin);
                    const fechaInicioFormateada = inicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Madrid' });
                    const horaInicio = inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
                    const horaFin = fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

                    // Usar la función de traducción con el parámetro soloTraducir=true
                    return await enviarMensajeWhatsApp('reservas.disponibilidad.formatoHorario', '', {
                        fecha: fechaInicioFormateada,
                        horaInicio: horaInicio,
                        horaFin: horaFin,
                        pista: horario.pista,
                        enlace: horario.enlace
                    }, true); // true indica que solo queremos la traducción, no enviar mensaje
                }));

                // Enviamos el mensaje completo con la lista de horarios ya traducidos
                await enviarMensajeWhatsApp('reservas.disponibilidad.alternativasMismoHorario', numero, {
                    listaHorarios: listaHorarios.join('\n')
                });

                return res.json({
                    status: "alternativas_mismo_horario",
                    message: "Mensaje enviado con alternativas en el mismo horario",
                    alternativas: alternativasMismoHorario
                });
            }

            // 3. Si no hay nada en el mismo horario, buscar alternativas en otros horarios
            const alternativas = await buscarAlternativasSlots(startDate, nombre, numero, partida, nivel, jugadores_faltan);
            if (alternativas.length > 0) {
                // Formatear cada horario con traducción individual
                const listaHorarios = await Promise.all(alternativas.map(async horario => {
                    const inicio = new Date(horario.inicio);
                    const fin = new Date(horario.fin);
                    const fechaInicioFormateada = inicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Madrid' });
                    const horaInicio = inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
                    const horaFin = fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

                    // Usar la función de traducción con el parámetro soloTraducir=true
                    return await enviarMensajeWhatsApp('reservas.disponibilidad.formatoHorario', '', {
                        fecha: fechaInicioFormateada,
                        horaInicio: horaInicio,
                        horaFin: horaFin,
                        pista: horario.pista,
                        enlace: horario.enlace
                    }, true); // true indica que solo queremos la traducción, no enviar mensaje
                }));

                // Enviamos el mensaje completo con la lista de horarios ya traducidos
                await enviarMensajeWhatsApp('reservas.disponibilidad.alternativas', numero, {
                    listaHorarios: listaHorarios.join('\n')
                });

                return res.json({
                    status: "alternativas",
                    message: "Mensaje enviado con alternativas en otros horarios",
                    alternativas
                });
            } else {
                // const mensaje = "😔 Lo sentimos, no hay disponibilidad ni alternativas cercanas.";
                // await enviarMensajeWhatsApp(mensaje, numero);
                await enviarMensajeWhatsApp('reservas.disponibilidad.noDisponible', numero)
                return res.json({
                    status: "nodisponible",
                    message: 'No hay disponibilidad'
                });
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    static async confirmarReserva(req, res) {

        const N8N_WEBHOOK_URL = "https://n8n.synergiapro.es/webhook/picketball-planner-partida-abierta"

        try {
            console.log("Datos recibidos en confirmarReserva:", req.body);
            const { pista, inicio, fin, nombre, numero, partida, nivel, jugadores_faltan } = req.body;

            // 1. Validación básica
            if (!pista || !inicio || !fin || !numero) {
                return res.status(400).json({
                    status: "error",
                    message: "Debes rellenar todos los campos para poder confirmar la reserva"
                });
            }

            //Recuperamos los datos del organizador en base al número
            const organizador = await JugadoresModel.getJugador(numero)
            if (!organizador || !organizador["Nombre Real"]) {
                return res.status(401).json({
                    status: "unauthorized",
                    message: "Necesitas estar registrado en el sistema para reservar una pista."
                });
            }

            // 2. Buscar el calendario de la pista
            const calendariosFiltrados = await obtenerCalendariosActivos();
            const pistaConfig = calendariosFiltrados.find(c => c.name === pista);
            if (!pistaConfig) {
                return res.status(400).json({
                    status: "error",
                    message: "Pista no encontrada o desactivada."
                });
            }

            // 3. Verificar disponibilidad (sin conflictos)
            const fechaInicio = new Date(inicio);
            const fechaFin = new Date(fin);
            const eventos = await GoogleCalendarService.getEvents(
                pistaConfig.id,
                fechaInicio.toISOString(),
                fechaFin.toISOString()
            );

            if (eventos && eventos.length > 0) {
                const mensaje = 'reservas.disponibilidad.pistaNoDisponible';
                await enviarMensajeWhatsApp(mensaje, numero);
                return res.status(409).json({
                    status: "error",
                    message: "Pista no disponible"
                });
            }

            // 4. Calcular número de jugadores actuales
            const jugadoresActuales = jugadores_faltan ? (4 - parseInt(jugadores_faltan)) : 4;

            let estado;
            if (parseInt(jugadores_faltan) === 0) {
                estado = "Completa";
            } else {
                estado = "Abierta";
            }

            // 5. Preparar nombres de invitados
            let jugador2 = "", jugador3 = "", jugador4 = "";
            const nombreBase = `Invitado de ${nombre}`;

            if (partida === "completa") {
                // Si es partida completa, siempre añadir los 3 invitados
                jugador2 = `${nombreBase} (1)`;
                jugador3 = `${nombreBase} (2)`;
                jugador4 = `${nombreBase} (3)`;
            } else if (partida === "abierta") {
                // Para partida abierta, según jugadores actuales
                if (jugadoresActuales >= 2) jugador2 = `${nombreBase} (1)`;
                if (jugadoresActuales >= 3) jugador3 = `${nombreBase} (2)`;
                if (jugadoresActuales >= 4) jugador4 = `${nombreBase} (3)`;
            }

            // 6. Generar ID único para la partida (formato: A001, A002...)
            const idPartida = `A${Math.floor(Math.random() * 900 + 100)}`;

            // 7. Crear el evento en el calendario
            const eventoTitulo = partida === "completa" ?
                `Partida Completa - ${nombre}` : `Partida Abierta - ${nombre}`;

            // 8. Preparar la descripción del evento
            const eventoDescripcion = `
ID: ${idPartida}
Fecha: ${fechaInicio.toISOString()}
Hora Inicio: ${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
Hora Fin: ${fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
Pista: ${pista}
Nivel: ${nivel}
Nº Actuales: ${jugadoresActuales}
Nº Faltantes: ${jugadores_faltan}
Jugador Principal: ${organizador["Nombre Real"]}
Teléfono: ${numero}
Jugador 2: ${jugador2}
Jugador 3: ${jugador3}
Jugador 4: ${jugador4}
`.trim();

            // 9. Crear el evento en Google Calendar
            const evento = await GoogleCalendarService.createEvent(pistaConfig.id, {
                summary: eventoTitulo,
                description: eventoDescripcion,
                start: { dateTime: fechaInicio.toISOString() },
                end: { dateTime: fechaFin.toISOString() },
                colorId: partida === "abierta" ? "5" : "1" // 5=Amarillo para partidas abiertas
            });

            // 10. Generar enlaces para cancelación, eliminación e invitación
            let urlCancelarCorta;
            const urlCancelar = `${DOMINIO_FRONTEND}/cancelar-reserva?eventId=${encodeURIComponent(evento.id)}&calendarId=${encodeURIComponent(pistaConfig.id)}&numero=${encodeURIComponent(numero)}`;
            if (NODE_ENV == 'production') { urlCancelarCorta = await shortenUrl(urlCancelar) } else { urlCancelarCorta = urlCancelar }

            let urlEliminarCorta;
            const urlEliminar = `${DOMINIO_FRONTEND}/eliminar-jugador-reserva?eventId=${encodeURIComponent(evento.id)}&numero=${encodeURIComponent(numero)}&nombreJugador=${encodeURIComponent(organizador["Nombre Real"])}&calendarId=${encodeURIComponent(pistaConfig.id)}`;
            if (NODE_ENV == 'production') { urlEliminarCorta = await shortenUrl(urlEliminar) } else { urlEliminarCorta = urlEliminar }

            // En el método confirmarReserva, modificar la creación de la URL
            let urlInvitarCorta;
            const urlInvitar = `${DOMINIO_FRONTEND}/unir-jugador-reserva?eventId=${encodeURIComponent(evento.id)}&nombre=${encodeURIComponent(organizador["Nombre Real"])}&numero=${encodeURIComponent(numero)}&calendarId=${encodeURIComponent(pistaConfig.id)}`;
            if (NODE_ENV == 'production') { urlInvitarCorta = await shortenUrl(urlInvitar) } else { urlInvitarCorta = urlInvitar }

            // Guardar la reserva en la base de datos
            try {
                // Extraer solo la fecha del ISO
                const fechaSoloISO = fechaInicio.toISOString().split('T')[0];

                // Extraer solo la hora
                const horaInicio = fechaInicio.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZone: 'Europe/Madrid'
                }).replace(/:/g, ':');

                const horaFin = fechaFin.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZone: 'Europe/Madrid'
                }).replace(/:/g, ':');

                // Crear objeto para la base de datos
                const reservaObj = {
                    "Fecha ISO": fechaSoloISO,
                    "Inicio": horaInicio,
                    "Fin": horaFin,
                    "Pista": pista,
                    "Nivel": nivel,
                    "Nº Actuales": jugadoresActuales,
                    "Nº Faltantes": parseInt(jugadores_faltan) || 0,
                    "Estado": estado,
                    "ID Event": evento.id,
                    "calendarID": pistaConfig.id,
                    "Fecha Creación": new Date().toISOString(),
                    "Fecha Actualización": new Date().toISOString(),
                    "1º Contacto": numero,
                    "Último Contacto": numero,
                    "Actualización": "Creación de la reserva",
                    "Jugador 1": organizador["Nombre Real"],
                    "Jugador 2": jugador2 || null,
                    "Jugador 3": jugador3 || null,
                    "Jugador 4": jugador4 || null,
                    "Telefono 1": numero,
                    "Telefono 2": null,
                    "Telefono 3": null,
                    "Telefono 4": null,
                    "Lista_invitados": "",
                    "Link Join": urlInvitarCorta,
                    "Link Delete": urlEliminarCorta,
                    "Link Cancel": urlCancelarCorta
                };

                // Guardar en la base de datos
                const reservaGuardada = await ReservasModel.create(reservaObj);
                console.log("Reserva guardada en la base de datos:", reservaGuardada);
            } catch (dbError) {
                console.error("Error al guardar la reserva en la base de datos:", dbError);
                // Si ocurre un error al guardar en base de datos, eliminar el evento del calendario
                try {
                    await GoogleCalendarService.deleteEvent(pistaConfig.id, evento.id);
                    console.log("Evento eliminado del calendario debido a error en base de datos.");
                } catch (deleteError) {
                    console.error("Error al eliminar el evento del calendario tras fallo en base de datos:", deleteError);
                }
                // Lanzar el error para que el flujo principal lo capture y devuelva error al cliente
                throw new Error("Necesita estar registrado en el sistema para reservar una pista.");
            }

            // 11. Formatear fecha para el mensaje
            const fechaFormateada = fechaInicio.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Europe/Madrid'
            });

            // 12. Preparar mensaje de confirmación según tipo de partida
            const horaInicio = fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
            const horaFin = fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
            const estadoTexto = estado === "Completa" ? "completa" : "abierta";
            const textoReserva = estado === "Completa" ? "Jugador sin Cancelar" : "Reserva sin Cancelar";

            await enviarMensajeWhatsApp('reservas.confirmacion.exito', numero, {
                nombre: organizador["Nombre Real"],
                fecha: fechaFormateada,
                horaInicio: horaInicio,
                horaFin: horaFin,
                pista: pista,
                urlCancelar: urlCancelarCorta,
                jugadores_faltan: jugadores_faltan,
                estado: estadoTexto,
                textoReserva: textoReserva,
                urlEliminar: urlEliminarCorta
            });

            // 14. Enviar mensaje adicional con enlace para invitar si es partida abierta
            await enviarMensajeWhatsApp('reservas.confirmacion.invitacion', numero, {
                urlInvitar: urlInvitarCorta
            });

            // Intentar cerrar la partida según se crea?
            // await fetch(N8N_WEBHOOK_URL, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({ eventId: evento.id, calendarId: pistaConfig.id })
            // });

            // 15. Devolver respuesta al frontend
            return res.json({
                status: "success",
                message: "Reserva confirmada exitosamente",
                data: {
                    idPartida,
                    eventoId: evento.id,
                    pista,
                    fechaInicio: fechaInicio.toISOString(),
                    fechaFin: fechaFin.toISOString(),
                    nombre: organizador["Nombre Real"],
                    enlaces: {
                        cancelar: urlCancelarCorta,
                        eliminar: urlEliminarCorta,
                        invitar: urlInvitarCorta
                    }
                }
            });

        } catch (error) {
            console.error("Error al confirmar reserva:", error);
            return res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    static async cancelarReserva(req, res) {
        try {
            // Obtener eventId de la ruta y demás parámetros de query
            const eventId = req.params.eventId;
            const { calendarId, numero, motivo } = req.query;

            // Validación básica
            if (!eventId || !calendarId) {
                return res.status(400).json({
                    status: "error",
                    message: "Los parámetros eventId y calendarId son obligatorios."
                });
            }

            // Verificar que el calendarId es válido
            const calendarioValido = CALENDARS.some(cal => cal.id === calendarId);
            if (!calendarioValido) {
                console.warn(`⚠️ Advertencia: calendarId no reconocido: ${calendarId}`);
                // Continuamos porque puede ser válido aunque no esté en la lista
            }

            // 1. Obtener detalles del evento antes de eliminarlo
            let evento;
            try {
                evento = await GoogleCalendarService.getEvent(calendarId, eventId);
                if (!evento) {
                    return res.status(404).json({
                        status: "error",
                        message: "No se encontró el evento especificado."
                    });
                }
            } catch (eventError) {
                console.error("Error al obtener detalles del evento:", eventError);
                // Continuamos con el proceso aunque no podamos obtener los detalles
            }

            // 2. Verificar si faltan más de 5 horas para el evento
            // if (evento && evento.start && evento.start.dateTime) {
            //     const fechaEvento = new Date(evento.start.dateTime);
            //     const ahora = new Date();
            //     const diffHoras = (fechaEvento - ahora) / (1000 * 60 * 60);

            //     if (diffHoras < 5) {
            //         return res.status(400).json({
            //             status: "error",
            //             message: "Solo se pueden cancelar reservas con al menos 5 horas de antelación."
            //         });
            //     }
            // }

            // 3. Eliminar el evento de Google Calendar
            try {
                console.log(`Eliminando evento ${eventId} del calendario ${calendarId}...`);
                const resultado = await GoogleCalendarService.deleteEvent(calendarId, eventId);

                if (resultado.alreadyDeleted) {
                    console.log("El evento ya había sido eliminado previamente.");
                }
            } catch (deleteError) {
                console.error("Error detallado al eliminar evento:", deleteError);

                // Proporcionar información más detallada sobre el error
                return res.status(500).json({
                    status: "error",
                    message: "Error al cancelar la reserva en el calendario: " +
                        (deleteError.message || "Error desconocido"),
                    details: deleteError.response?.data || {}
                });
            }

            // 4. Marcar el registro como cancelado en la base de datos (en lugar de eliminarlo)
            let reservaCancelada;
            try {
                reservaCancelada = await ReservasModel.markAsCancelled(eventId, motivo);
            } catch (dbError) {
                console.error("Error al marcar registro como cancelado en la base de datos:", dbError);
                // No devolvemos error porque el evento ya se eliminó del calendario
            }

            // 5. Preparar mensaje de confirmación para WhatsApp
            if (numero && evento) {
                const fechaEvento = new Date(evento.start.dateTime);
                const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Europe/Madrid'
                });

                const horaInicio = fechaEvento.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid'
                });

                let pistaInfo = "";
                if (evento.description) {
                    const descripcionLineas = evento.description.split('\n');
                    for (const linea of descripcionLineas) {
                        if (linea.startsWith('Pista:')) {
                            pistaInfo = linea.split(':')[1].trim();
                            break;
                        }
                    }
                }

                // Formatear el texto del motivo si existe
                const motivoTexto = motivo ? `\n\n📝 Motivo: "${motivo}"` : '';

                // 6. Enviar mensaje de WhatsApp con internacionalización
                try {
                    await enviarMensajeWhatsApp('reservas.cancelacion.exito', numero, {
                        fecha: fechaFormateada,
                        hora: horaInicio,
                        pista: pistaInfo || "No especificada",
                        motivoTexto: motivoTexto
                    });
                } catch (whatsappError) {
                    console.error("Error al enviar mensaje WhatsApp:", whatsappError);
                    // No bloqueamos la respuesta por un error en WhatsApp
                }
            }

            // 7. Devolver respuesta exitosa
            return res.status(200).json({
                status: "success",
                message: "La reserva ha sido cancelada exitosamente.",
                data: {
                    eventoId: eventId,
                    reservaCancelada
                }
            });

        } catch (error) {
            console.error("Error general al cancelar reserva:", error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Error al procesar la cancelación de la reserva."
            });
        }
    }

    static async unirseReserva(req, res) {
        try {
            const { eventId, numeroInvitado, organizador, numeroOrganizador, tipoUnion, calendarId } = req.body;

            // Validación básica
            if (!eventId || !calendarId) {
                return res.status(400).json({
                    status: "error",
                    message: "Los parámetros eventId y calendarId son obligatorios."
                });
            }

            const datosInvitado = await JugadoresModel.getJugador(numeroInvitado)
            if (!datosInvitado || !datosInvitado["Nombre Real"]) {
                return res.status(401).json({
                    status: "unauthorized",
                    message: "Necesitas estar registrado en el sistema para unirte a una partida."
                });
            }
            const nombreInvitado = datosInvitado["Nombre Real"]

            // Si es una unión de tipo "new" (con número de teléfono), verificar si el usuario está registrado
            if (tipoUnion === "new" && numeroInvitado) {
                try {
                    // Verificar si el usuario está registrado en el sistema
                    const usuarioExiste = await JugadoresModel.getJugador(numeroInvitado)
                    if (!usuarioExiste) {
                        return res.status(401).json({
                            status: "unauthorized",
                            message: "Necesitas estar registrado en el sistema para unirte a una partida."
                        });
                    }
                } catch (error) {
                    console.error("Error al verificar si el usuario existe:", error);
                    return res.status(401).json({
                        status: "unauthorized",
                        message: "Necesitas estar registrado en el sistema para unirte a una partida."
                    });
                }
            }

            // Obtener detalles de la reserva desde Google Calendar
            let evento;
            try {
                evento = await GoogleCalendarService.getEvent(calendarId, eventId);
                if (!evento) {
                    return res.status(404).json({
                        status: "error",
                        message: "No se encontró la partida especificada."
                    });
                }
            } catch (error) {
                console.error("Error al obtener evento de Google Calendar:", error);
                return res.status(500).json({
                    status: "error",
                    message: "Error al obtener detalles de la reserva."
                });
            }

            // Extraer información relevante del evento
            const descripcion = evento.description || "";

            // Extraer información del evento
            const infoMap = {};
            descripcion.split('\n').forEach(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':', 2);
                    infoMap[key.trim()] = value.trim();
                }
            });

            // Verificar si hay espacio disponible
            const jugadoresFaltan = parseInt(infoMap['Nº Faltantes'] || '0');
            if (jugadoresFaltan <= 0) {
                return res.status(400).json({
                    status: "error",
                    message: "La partida está completa. No se pueden añadir más jugadores."
                });
            }

            // Actualizar el evento en el calendario y la base de datos
            await actualizarPartidaConNuevoJugador(eventId, calendarId, nombreInvitado, numeroInvitado, tipoUnion);

            // Enviar notificaciones según el tipo de unión
            if (tipoUnion === "new" && numeroInvitado) {
                // Preparar datos para el mensaje
                const fechaEvento = new Date(evento.start.dateTime);
                const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Europe/Madrid'
                });

                const horaInicio = fechaEvento.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid'
                });

                const horaFin = new Date(evento.end.dateTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid'
                });

                // Calcular jugadores actuales después de la unión
                const jugadoresActuales = parseInt(infoMap['Nº Actuales'] || '1') + 1;
                const jugadoresFaltantesActualizados = jugadoresFaltan - 1;

                // Crear URL para que el jugador pueda eliminarse
                const urlEliminar = `${DOMINIO_FRONTEND}/eliminar-jugador-reserva?eventId=${encodeURIComponent(eventId)}&numero=${encodeURIComponent(numeroInvitado)}&nombreJugador=${encodeURIComponent(nombreInvitado)}&calendarId=${encodeURIComponent(calendarId)}`;

                // Acortar URL si estamos en producción
                let urlEliminarCorta;
                if (NODE_ENV == 'production') {
                    urlEliminarCorta = await shortenUrl(urlEliminar);
                } else {
                    urlEliminarCorta = urlEliminar;
                }

                // Preparar datos para los jugadores
                const jugador1 = infoMap['Jugador Principal'] || 'Organizador';
                const jugador2 = infoMap['Jugador 2'] ? `2. ${infoMap['Jugador 2']}\n` : '';
                const jugador3 = infoMap['Jugador 3'] ? `3. ${infoMap['Jugador 3']}\n` : '';
                const jugador4 = infoMap['Jugador 4'] ? `4. ${infoMap['Jugador 4']}\n` : '';

                // Determinar el estado de jugadores usando traducciones
                let estadoJugadoresKey;
                if (jugadoresFaltantesActualizados > 0) {
                    // Obtener traducción para "Aún faltan X jugadores"
                    estadoJugadoresKey = await enviarMensajeWhatsApp('reservas.unirse.jugadoresFaltan', '', {
                        cantidad: jugadoresFaltantesActualizados
                    }, true);
                } else {
                    // Obtener traducción para "La partida está completa"
                    estadoJugadoresKey = await enviarMensajeWhatsApp('reservas.unirse.partidaCompleta', '', {}, true);
                }

                // Enviar mensaje al nuevo jugador usando internacionalización
                await enviarMensajeWhatsApp('reservas.unirse.exito', numeroInvitado, {
                    idPartida: infoMap['ID'] || 'No disponible',
                    fecha: fechaFormateada,
                    horaInicio: horaInicio,
                    horaFin: horaFin,
                    pista: infoMap['Pista'] || evento.summary || 'No especificada',
                    nivel: infoMap['Nivel'] || 'No especificado',
                    organizador: infoMap['Jugador Principal'] || organizador || 'No especificado',
                    jugadoresActuales: jugadoresActuales,
                    jugador1: `1. ${jugador1}\n`,
                    jugador2: jugador2,
                    jugador3: jugador3,
                    jugador4: jugador4,
                    estadoJugadores: estadoJugadoresKey,
                    urlEliminar: urlEliminarCorta
                });
            }

            const telefono = numeroOrganizador || infoMap['Teléfono'];

            // Notificar al organizador
            if (telefono) {
                // Formatear fecha y hora para mejor legibilidad
                const fechaEvento = new Date(evento.start.dateTime);
                const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Europe/Madrid'
                });

                const horaInicio = fechaEvento.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid'
                });

                const horaFin = new Date(evento.end.dateTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid'
                });

                // Calcular jugadores actuales después de la unión
                const jugadoresActuales = parseInt(infoMap['Nº Actuales'] || '1') + 1;
                const jugadoresFaltantesActualizados = jugadoresFaltan - 1;

                let estadoJugadoresKey;
                if (jugadoresFaltantesActualizados > 0) {
                    // Obtener traducción para "Aún faltan X jugadores" para el organizador
                    estadoJugadoresKey = await enviarMensajeWhatsApp('reservas.nuevoJugador.jugadoresFaltan', '', {
                        cantidad: jugadoresFaltantesActualizados
                    }, true);
                } else {
                    // Obtener traducción para "Partida completa" para el organizador
                    estadoJugadoresKey = await enviarMensajeWhatsApp('reservas.nuevoJugador.partidaCompleta', '', {}, true);
                }

                // Enviar mensaje al organizador usando internacionalización
                await enviarMensajeWhatsApp('reservas.nuevoJugador.notificacion', telefono, {
                    nombreJugador: nombreInvitado,
                    idPartida: infoMap['ID'] || 'No disponible',
                    fecha: fechaFormateada,
                    horaInicio: horaInicio,
                    horaFin: horaFin,
                    pista: infoMap['Pista'] || evento.summary || 'No especificada',
                    nivel: infoMap['Nivel'] || 'No especificado',
                    estadoJugadores: estadoJugadoresKey
                });
            }

            return res.json({
                status: "success",
                message: tipoUnion === "new"
                    ? "Te has unido a la partida. Recibirás notificaciones por WhatsApp."
                    : "Te has unido a la partida como invitado.",
                nombre: nombreInvitado
            });
        } catch (error) {
            console.error("Error al unirse a la reserva:", error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Error al procesar la unión a la partida."
            });
        }
    }

    static async eliminarJugadorReserva(req, res) {
        try {
            const { eventId, calendarId, nombreJugador, numero } = req.body;

            // Validación básica
            if (!eventId || !calendarId || !nombreJugador) {
                return res.status(400).json({
                    status: "error",
                    message: "Los parámetros eventId, calendarId y nombreJugador son obligatorios."
                });
            }

            // 1. Obtener evento desde Google Calendar usando el servicio
            let evento;
            try {
                evento = await GoogleCalendarService.getEvent(calendarId, eventId);

                if (!evento) {
                    return res.status(404).json({
                        status: "error",
                        message: "No se encontró la partida especificada."
                    });
                }
            } catch (errorCalendar) {
                console.error("Error al obtener evento de Google Calendar:", errorCalendar);
                return res.status(500).json({
                    status: "error",
                    message: "Error al acceder a los detalles de la partida."
                });
            }

            // 2. Extraer información y verificar que el jugador existe
            const descripcion = evento.description || "";
            const infoMap = {};
            descripcion.split('\n').forEach(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':', 2);
                    infoMap[key.trim()] = value.trim();
                }
            });

            // Encontrar la posición del jugador a eliminar
            let posicionJugador = 0;
            for (let i = 2; i <= 4; i++) {
                if (infoMap[`Jugador ${i}`] === nombreJugador) {
                    posicionJugador = i;
                    break;
                }
            }

            if (posicionJugador === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "El jugador especificado no se encontró en esta partida."
                });
            }

            // 3. Actualizar contadores
            const jugadoresActuales = parseInt(infoMap['Nº Actuales'] || '1') - 1;
            const jugadoresFaltan = parseInt(infoMap['Nº Faltantes'] || '0') + 1;

            // 4. Preparar nueva descripción para Google Calendar
            const lineas = descripcion.split('\n');
            const nuevasLineas = lineas.map(line => {
                if (line.startsWith('Nº Actuales:')) {
                    return `Nº Actuales: ${jugadoresActuales}`;
                } else if (line.startsWith('Nº Faltantes:')) {
                    return `Nº Faltantes: ${jugadoresFaltan}`;
                } else if (line.startsWith(`Jugador ${posicionJugador}:`)) {
                    return `Jugador ${posicionJugador}: `;
                } else if (line.startsWith(`Telefono ${posicionJugador}:`)) {
                    return `Telefono ${posicionJugador}: `;
                }
                return line;
            });

            // 5. Actualizar evento en Google Calendar usando el servicio
            try {
                await GoogleCalendarService.updateEvent(calendarId, eventId, {
                    description: nuevasLineas.join('\n')
                });
            } catch (errorUpdate) {
                console.error("Error al actualizar evento en Google Calendar:", errorUpdate);
                return res.status(500).json({
                    status: "error",
                    message: "Error al actualizar la información de la partida."
                });
            }

            // 6. Actualizar registro en base de datos usando el modelo
            try {
                await ReservasModel.removePlayer(
                    eventId,
                    posicionJugador,
                    jugadoresActuales,
                    jugadoresFaltan,
                    nombreJugador
                );
            } catch (dbError) {
                console.error("Error al actualizar la base de datos:", dbError);
                // No detenemos la ejecución ya que el calendario ya se actualizó
            }

            // 7. Notificar al organizador
            const organizadorNumero = infoMap['Teléfono'] || numero;
            const organizadorNombre = infoMap['Jugador Principal'] || "Organizador";

            if (organizadorNumero) {
                try {
                    const fechaEvento = new Date(evento.start.dateTime);
                    const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'Europe/Madrid'
                    });

                    const horaEvento = fechaEvento.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Madrid'
                    });

                    await enviarMensajeWhatsApp('reservas.eliminarJugador.exito', organizadorNumero, {
                        nombreJugador: nombreJugador,
                        fecha: fechaFormateada,
                        hora: horaEvento,
                        pista: infoMap['Pista'] || "No especificada",
                        jugadoresActuales: jugadoresActuales,
                        jugadoresFaltan: jugadoresFaltan
                    });
                } catch (whatsappError) {
                    console.error("Error al enviar mensaje WhatsApp:", whatsappError);
                    // No bloqueamos la respuesta por este error
                }
            }

            // 8. Notificar al jugador eliminado si tenemos su teléfono
            const telefonoJugador = infoMap[`Telefono ${posicionJugador}`];
            if (telefonoJugador) {
                try {
                    const fechaEvento = new Date(evento.start.dateTime);
                    const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'Europe/Madrid'
                    });

                    const horaEvento = fechaEvento.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Madrid'
                    });

                    await enviarMensajeWhatsApp('reservas.eliminarJugador.notificacion', telefonoJugador, {
                        organizador: organizadorNombre,
                        fecha: fechaFormateada,
                        hora: horaEvento,
                        pista: infoMap['Pista'] || "No especificada"
                    });
                } catch (whatsappError) {
                    console.error("Error al enviar mensaje WhatsApp:", whatsappError);
                    // No bloqueamos la respuesta por este error
                }
            }

            // 9. Devolver respuesta exitosa
            return res.json({
                status: "success",
                message: `El jugador ${nombreJugador} ha sido eliminado exitosamente de la partida.`,
                data: {
                    eventoId: eventId,
                    jugadoresActuales,
                    jugadoresFaltan
                }
            });
        } catch (error) {
            console.error("Error general al eliminar jugador:", error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Error al procesar la eliminación del jugador."
            });
        }
    }

    static async obtenerReservasActivas(req, res) {
        try {
            const { numero } = req.params;
            const { nombre } = req.query;

            console.log(`Número --> ${numero}\nNombre --> ${nombre}`)

            // Validación básica
            if (!numero) {
                return res.status(400).json({
                    status: "error",
                    message: "El parámetro 'numero' es obligatorio."
                });
            }

            // 1. Obtener las partidas futuras del usuario
            const { partidasCompletas, partidasAbiertas } = await ReservasModel.getReservasActivas(numero);

            // 2. Formatear el mensaje para WhatsApp con emojis
            let mensajeFinal = '';

            // Encabezado con traducción
            const encabezado = await enviarMensajeWhatsApp('reservas.misReservas.encabezado', '', {
                nombre: nombre || 'jugador'
            }, true);
            mensajeFinal += encabezado;

            // PARTIDAS COMPLETAS
            if (partidasCompletas.length > 0) {
                // Título de sección Partidas Completas
                const tituloCompletas = await enviarMensajeWhatsApp('reservas.misReservas.partidasCompletas', '', {}, true);
                mensajeFinal += tituloCompletas;

                // Iterar cada partida completa y formatear
                for (const info of partidasCompletas) {
                    // Formato base de partida
                    const estado = await enviarMensajeWhatsApp(info.estadoClave, '', {}, true);
                    const separador = await enviarMensajeWhatsApp('fecha_separador', '', {}, true);

                    // Formatear fecha completa con separador traducido
                    const fechaLegible = `${info.fecha}${separador}${info.hora}`;

                    // Usar fechaLegible ya formateada con traducciones
                    const formatoPartida = await enviarMensajeWhatsApp('reservas.misReservas.formatoPartida', '', {
                        idPartida: info.idPartida,
                        fechaLegible: fechaLegible,
                        estado: estado
                    }, true);

                    mensajeFinal += formatoPartida;

                    // Solo mostrar links si es el jugador principal
                    if (info.esDuenio) {
                        // Mostrar opciones de gestión para el dueño (ahora igual que en partidas abiertas)
                        const opcionesDuenio = await enviarMensajeWhatsApp('reservas.misReservas.opcionesDuenio', '', {
                            linkJoin: info.linkJoin,
                            linkDelete: info.linkDelete,
                            linkCancel: info.linkCancel
                        }, true);
                        mensajeFinal += opcionesDuenio;
                    }
                    mensajeFinal += '\n';
                }
            } else {
                // Mensaje cuando no hay partidas completas
                const sinCompletas = await enviarMensajeWhatsApp('reservas.misReservas.sinPartidasCompletas', '', {}, true);
                mensajeFinal += sinCompletas;
            }

            // PARTIDAS ABIERTAS - Código existente sin cambios
            if (partidasAbiertas.length > 0) {
                // Título de sección Partidas Abiertas
                const tituloAbiertas = await enviarMensajeWhatsApp('reservas.misReservas.partidasAbiertas', '', {}, true);
                mensajeFinal += tituloAbiertas;

                // Iterar cada partida abierta y formatear
                for (const info of partidasAbiertas) {
                    // Formato base de partida
                    const estado = await enviarMensajeWhatsApp(info.estadoClave, '', {}, true);
                    const separador = await enviarMensajeWhatsApp('fecha_separador', '', {}, true);
                    const fechaLegible = `${info.fecha}${separador}${info.hora}`;

                    const formatoPartida = await enviarMensajeWhatsApp('reservas.misReservas.formatoPartida', '', {
                        idPartida: info.idPartida,
                        fechaLegible: fechaLegible,
                        estado: estado
                    }, true);

                    mensajeFinal += formatoPartida;

                    // Información adicional de jugadores para partidas abiertas
                    const formatoPartidaAbierta = await enviarMensajeWhatsApp('reservas.misReservas.formatoPartidaAbierta', '', {
                        jugadoresActuales: info.jugadoresActuales,
                        jugadoresFaltantes: info.jugadoresFaltantes
                    }, true);
                    mensajeFinal += formatoPartidaAbierta;

                    // Solo mostrar links si es el jugador principal
                    if (info.esDuenio) {
                        const opcionesDuenio = await enviarMensajeWhatsApp('reservas.misReservas.opcionesDuenio', '', {
                            linkJoin: info.linkJoin,
                            linkDelete: info.linkDelete,
                            linkCancel: info.linkCancel
                        }, true);
                        mensajeFinal += opcionesDuenio;
                    }
                    mensajeFinal += '\n';
                }
            } else {
                // Mensaje cuando no hay partidas abiertas
                const sinAbiertas = await enviarMensajeWhatsApp('reservas.misReservas.sinPartidasAbiertas', '', {}, true);
                mensajeFinal += sinAbiertas;
            }

            // Mensaje de despedida
            const despedida = await enviarMensajeWhatsApp('reservas.misReservas.despedida', '', {}, true);
            mensajeFinal += despedida;

            // 3. Enviar el mensaje por WhatsApp
            try {
                await enviarMensajeWhatsApp(mensajeFinal, numero);
            } catch (whatsappError) {
                console.error("Error al enviar mensaje WhatsApp:", whatsappError);
                // No bloqueamos la respuesta por error en WhatsApp
            }

            // 4. Devolver respuesta exitosa
            return res.status(200).json({
                status: "success",
                message: "Mensaje enviado correctamente",
                data: {
                    partidasCompletas: partidasCompletas.length,
                    partidasAbiertas: partidasAbiertas.length
                }
            });

        } catch (error) {
            console.error("Error al obtener reservas activas:", error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Error al obtener reservas activas"
            });
        }
    }

    static async obtenerSlotsDisponibles(req, res) {
        try {
            const { fecha } = req.query;

            if (!fecha) {
                return res.status(400).json({
                    status: "error",
                    message: "El parámetro 'fecha' es obligatorio."
                });
            }

            const startDate = new Date(fecha);

            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    status: "error",
                    message: "La fecha proporcionada no es válida."
                });
            }

            // Obtener tanto los slots vacíos como las partidas abiertas
            const [slotsDisponibles, partidasAbiertas] = await Promise.all([
                buscarTodosLosSlotsDisponibles(startDate),
                buscarPartidasAbiertas(startDate)
            ]);

            // Formatear los slots vacíos para incluir el tipo
            const slotsFormateados = slotsDisponibles.map(slot => ({
                ...slot,
                tipo: 'disponible'  // Marca que es un slot vacío
            }));

            // Combinar ambos resultados
            const todosLosSlots = [...slotsFormateados, ...partidasAbiertas];

            // Ordenar por hora de inicio
            todosLosSlots.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

            if (todosLosSlots.length > 0) {
                return res.json({
                    status: "success",
                    data: todosLosSlots
                });
            } else {
                return res.json({
                    status: "nodisponible",
                    message: "No hay horarios disponibles ni partidas abiertas para la fecha seleccionada.",
                    data: []
                });
            }

        } catch (error) {
            console.error("Error al obtener slots disponibles:", error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Error interno del servidor."
            });
        }
    }

}




function verificarRestriccionesHorario(slotInicio, slotFin, restricciones) {
    if (!restricciones || restricciones.length === 0) {
        return null; // No hay restricciones
    }

    const diaSemana = getDiaSemana(slotInicio.getDay());
    const horaInicioSlot = `${slotInicio.getHours().toString().padStart(2, '0')}:${slotInicio.getMinutes().toString().padStart(2, '0')}`;
    const horaFinSlot = `${slotFin.getHours().toString().padStart(2, '0')}:${slotFin.getMinutes().toString().padStart(2, '0')}`;

    console.log(`🔍 Verificando slot ${diaSemana} ${horaInicioSlot}-${horaFinSlot} contra ${restricciones.length} restricciones`);

    // Función para comparar horas en formato "HH:MM"
    const compararHoras = (hora1, hora2) => {
        const [h1, m1] = hora1.split(':').map(Number);
        const [h2, m2] = hora2.split(':').map(Number);
        if (h1 !== h2) return h1 - h2;
        return m1 - m2;
    };

    // Verificar cada restricción
    for (const restriccion of restricciones) {
        // Verificar si el día de la semana está incluido en la restricción
        if (restriccion.dias.includes(diaSemana)) {
            // Comprobar si hay solapamiento de horarios
            const inicioRestriccion = restriccion.hora_inicio;
            const finRestriccion = restriccion.hora_fin;

            console.log(`  📌 Evaluando restricción para ${diaSemana}: ${inicioRestriccion}-${finRestriccion}`);

            // Hay solapamiento si:
            // 1. El inicio del slot está dentro de la restricción
            const condicion1 = (compararHoras(horaInicioSlot, inicioRestriccion) >= 0 && compararHoras(horaInicioSlot, finRestriccion) < 0);
            // 2. El fin del slot está dentro de la restricción
            const condicion2 = (compararHoras(horaFinSlot, inicioRestriccion) > 0 && compararHoras(horaFinSlot, finRestriccion) <= 0);
            // 3. La restricción está completamente contenida en el slot
            const condicion3 = (compararHoras(horaInicioSlot, inicioRestriccion) <= 0 && compararHoras(horaFinSlot, finRestriccion) >= 0);

            console.log(`    Condiciones: ${condicion1 ? '✓' : '✗'} | ${condicion2 ? '✓' : '✗'} | ${condicion3 ? '✓' : '✗'}`);

            if (condicion1 || condicion2 || condicion3) {
                console.log(`    ⛔ SLOT BLOQUEADO por ${restriccion.tipo}: ${restriccion.descripcion || 'sin descripción'}`);
                return {
                    tipo: restriccion.tipo,
                    descripcion: restriccion.descripcion || (restriccion.tipo === 'bloqueo' ? 'Horario bloqueado' : 'Clase programada'),
                    hora_inicio: restriccion.hora_inicio,
                    hora_fin: restriccion.hora_fin
                };
            }
        }
    }

    console.log(`  ✅ Slot no tiene restricciones aplicables`);
    return null; // No hay restricciones que bloqueen este slot
}
function getDiaSemana(numeroDia) {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dia = diasSemana[numeroDia];
    console.log(`Día ${numeroDia} corresponde a '${dia}'`);
    return dia;
}
// NUEVA FUNCIÓN HELPER: Busca todos los slots disponibles en un día
async function buscarTodosLosSlotsDisponibles(fecha) {
    console.log("Buscando slots disponibles para:", fecha);
    const slots = [];
    const dia = fecha.getDay();
    const isWeekend = dia === 0 || dia === 6;
    console.log(`Es fin de semana: ${isWeekend ? 'Sí' : 'No'} (día ${dia})`);
    const diaSemana = getDiaSemana(dia);
    console.log(`Día de la semana para verificación: '${diaSemana}'`);


    const timeZoneOffset = -new Date().getTimezoneOffset() / 60;
    console.log(`Offset de zona horaria local: UTC${timeZoneOffset >= 0 ? '+' : ''}${timeZoneOffset}`);

    const ahora = new Date();

    const calendariosFiltrados = await obtenerCalendariosActivos();
    console.log(`Usando ${calendariosFiltrados.length} pistas activas`);

    const pistasHorarios = calendariosFiltrados.map(pista => {
        const horarios = isWeekend ? pista.businessHours.weekends : pista.businessHours.weekdays;

        console.log(`Configuración de ${pista.name}:`,
            isWeekend ?
                `Fin de semana: ${JSON.stringify(horarios)}` :
                `Días laborables: ${JSON.stringify(horarios)}`);

        return {
            pista,
            horarios: horarios || []
        };
    }).filter(item => item.horarios.length > 0);

    console.log(`Procesando ${pistasHorarios.length} pistas con horarios configurados`);

    for (const { pista, horarios } of pistasHorarios) {
        console.log(`\nGenerando slots para ${pista.name} en ${isWeekend ? 'fin de semana' : 'día laborable'}`);
        console.log(`  Restricciones cargadas: ${pista.restricciones?.length || 0}`);

        for (const rango of horarios) {
            console.log(`- Rango configurado: ${rango.start} a ${rango.end}`);

            const [startHour, startMinute] = rango.start.split(":").map(Number);
            const [endHour, endMinute] = rango.end.split(":").map(Number);

            let slotInicio = new Date(fecha);
            slotInicio.setHours(startHour, startMinute, 0, 0);

            let slotFinRango = new Date(fecha);
            slotFinRango.setHours(endHour, endMinute, 0, 0);

            if ((endHour === 0 && endMinute === 0) || endHour < startHour) {
                slotFinRango.setDate(slotFinRango.getDate() + 1);
                console.log(`  Ajustando horario que cruza medianoche: ${rango.start} a ${rango.end} (día siguiente)`);
            }

            console.log(`- Generando slots desde ${slotInicio.toLocaleTimeString()} hasta ${slotFinRango.toLocaleTimeString()}`);

            while (slotInicio < slotFinRango) {
                const slotFin = new Date(slotInicio.getTime() + pista.slotDuration * 60000);

                if (slotFin > slotFinRango) break;

                if (slotInicio > ahora) {
                    try {
                        // NUEVO: Verificar restricciones antes de verificar eventos
                        const restriccion = verificarRestriccionesHorario(slotInicio, slotFin, pista.restricciones);

                        if (restriccion) {
                            console.log(`  🚫 Slot ${slotInicio.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })} bloqueado por ${restriccion.tipo}: ${restriccion.descripcion}`);
                        } else {
                            // Si no hay restricciones, verificar eventos programados
                            const eventos = await GoogleCalendarService.getEvents(
                                pista.id,
                                slotInicio.toISOString(),
                                slotFin.toISOString()
                            );

                            if (!eventos || eventos.length === 0) {
                                console.log(`  ✅ Slot disponible: ${slotInicio.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })}`);
                                slots.push({
                                    pista: pista.name,
                                    inicio: slotInicio.toISOString(),
                                    fin: slotFin.toISOString(),
                                    enlace: null // Se generará después si es necesario
                                });
                            } else {
                                console.log(`  ❌ Slot ocupado (${eventos.length} eventos): ${slotInicio.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })}`);
                            }
                        }
                    } catch (error) {
                        console.error(`  Error al verificar eventos para ${pista.name}:`, error);
                    }
                } else {
                    console.log(`  ⏰ Slot en el pasado, ignorado: ${slotInicio.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })}`);
                }

                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
            }
        }
    }

    const sortedSlots = slots.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    console.log(`Total de slots disponibles encontrados: ${sortedSlots.length}`);

    return sortedSlots;
}

// Helper: Busca si la hora coincide exactamente con un slot y si hay pista libre
async function buscarSlotDisponibleExacto(startDate) {
    const dia = startDate.getDay()
    const isWeekend = dia === 0 || dia === 6

    const calendariosFiltrados = await obtenerCalendariosActivos();

    // Para cada pista, comprobar si el horario solicitado está disponible
    for (const pista of calendariosFiltrados) {
        const horarios = isWeekend ? pista.businessHours.weekends : pista.businessHours.weekdays
        if (!horarios || horarios.length === 0) continue

        for (const rango of horarios) {
            const [startHour, startMinute] = rango.start.split(":").map(Number)
            const [endHour, endMinute] = rango.end.split(":").map(Number)
            let slotInicio = new Date(startDate)
            slotInicio.setHours(startHour, startMinute, 0, 0)
            let slotFinRango = new Date(startDate)
            slotFinRango.setHours(endHour, endMinute, 0, 0)
            if (endHour === 0 && endMinute === 0) slotFinRango.setHours(24, 0, 0, 0)

            while (slotInicio < slotFinRango) {
                let slotFin = new Date(slotInicio.getTime() + pista.slotDuration * 60000)
                if (slotFin > slotFinRango) break

                // ¿La hora solicitada coincide exactamente con el inicio del slot?
                if (Math.abs(slotInicio.getTime() - startDate.getTime()) < 60000) {
                    // NUEVO: Verificar restricciones antes de comprobar eventos
                    const restriccion = verificarRestriccionesHorario(slotInicio, slotFin, pista.restricciones);

                    if (restriccion) {
                        // Slot bloqueado por restricción, pasar a la siguiente pista
                        console.log(`Slot exacto bloqueado por ${restriccion.tipo} en ${pista.name}: ${restriccion.descripcion}`);
                        break;
                    }

                    // Comprobar si está libre de eventos
                    const eventos = await GoogleCalendarService.getEvents(
                        pista.id,
                        slotInicio.toISOString(),
                        slotFin.toISOString()
                    )
                    if (!eventos || eventos.length === 0) {
                        return { pista, slotInicio, slotFin, disponible: true }
                    }
                    // NO devolvemos si está ocupada, seguimos buscando en otras pistas
                    break; // Salimos del bucle while para esta pista y rango
                }
                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000)
            }
        }
    }
    return null // Solo si ninguna pista está disponible en el horario exacto
}
// Añadir esta nueva función después de buscarSlotDisponibleExacto
async function buscarAlternativasMismoHorario(startDate, nombre, numero, partida, nivel, jugadores_faltan) {
    const alternativas = [];
    const dia = startDate.getDay();
    const isWeekend = dia === 0 || dia === 6;

    // Obtener solo calendarios activos
    const calendariosFiltrados = await obtenerCalendariosActivos();

    // Para cada pista activa, comprobar si el horario solicitado está disponible
    for (const pista of calendariosFiltrados) {
        const horarios = isWeekend ? pista.businessHours.weekends : pista.businessHours.weekdays;
        if (!horarios || horarios.length === 0) continue;

        for (const rango of horarios) {
            const [startHour, startMinute] = rango.start.split(":").map(Number);
            const [endHour, endMinute] = rango.end.split(":").map(Number);
            let slotInicio = new Date(startDate);
            slotInicio.setHours(startHour, startMinute, 0, 0);
            let slotFinRango = new Date(startDate);
            slotFinRango.setHours(endHour, endMinute, 0, 0);
            if (endHour === 0 && endMinute === 0) slotFinRango.setHours(24, 0, 0, 0);

            while (slotInicio < slotFinRango) {
                let slotFin = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
                if (slotFin > slotFinRango) break;

                // ¿La hora solicitada coincide exactamente con el inicio del slot?
                if (Math.abs(slotInicio.getTime() - startDate.getTime()) < 60000) {
                    // NUEVO: Verificar restricciones antes de comprobar eventos
                    const restriccion = verificarRestriccionesHorario(slotInicio, slotFin, pista.restricciones);

                    if (restriccion) {
                        // Slot bloqueado por restricción, pasar al siguiente
                        console.log(`Alternativa mismo horario bloqueada por ${restriccion.tipo} en ${pista.name}: ${restriccion.descripcion}`);
                        break;
                    }

                    // Comprobar si está libre
                    const eventos = await GoogleCalendarService.getEvents(
                        pista.id,
                        slotInicio.toISOString(),
                        slotFin.toISOString()
                    );

                    if (!eventos || eventos.length === 0) {
                        const reservaPayload = {
                            pista: pista.name,
                            inicio: slotInicio.toISOString(),
                            fin: slotFin.toISOString(),
                            nombre,
                            numero,
                            partida,
                            nivel,
                            jugadores_faltan
                        };

                        const urlReserva = `${DOMINIO_FRONTEND}/confirmar-reserva?data=${encodeURIComponent(JSON.stringify(reservaPayload))}`;
                        let enlace;
                        if (NODE_ENV === 'production') {
                            enlace = await shortenUrl(urlReserva);
                        } else {
                            enlace = urlReserva;
                        }

                        alternativas.push({
                            pista: pista.name,
                            inicio: slotInicio.toISOString(),
                            fin: slotFin.toISOString(),
                            enlace
                        });
                    }
                    break; // Ya revisamos esta hora para esta pista
                }
                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
            }
        }
    }

    return alternativas;
}
// Helper: Busca los dos siguientes slots libres más cercanos a la intención del usuario
async function buscarAlternativasSlots(startDate, nombre, numero, partida, nivel, jugadores_faltan) {
    const alternativas = [];
    const fechaBase = new Date(startDate);
    fechaBase.setSeconds(0, 0);
    const dia = fechaBase.getDay();
    const isWeekend = dia === 0 || dia === 6;

    // Obtener solo calendarios activos
    const calendariosFiltrados = await obtenerCalendariosActivos();

    for (const pista of calendariosFiltrados) {
        const horarios = isWeekend ? pista.businessHours.weekends : pista.businessHours.weekdays;
        if (!horarios || horarios.length === 0) continue;

        for (const rango of horarios) {
            const [startHour, startMinute] = rango.start.split(":").map(Number);
            const [endHour, endMinute] = rango.end.split(":").map(Number);
            let slotInicio = new Date(fechaBase);
            slotInicio.setHours(startHour, startMinute, 0, 0);
            let slotFinRango = new Date(fechaBase);
            slotFinRango.setHours(endHour, endMinute, 0, 0);
            if (endHour === 0 && endMinute === 0) slotFinRango.setHours(24, 0, 0, 0);

            while (slotInicio < slotFinRango) {
                let slotFin = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
                if (slotFin > slotFinRango) break;

                // Solo buscar en horarios diferentes al solicitado
                if (slotInicio > startDate && Math.abs(slotInicio.getTime() - startDate.getTime()) > 60000) {
                    // NUEVO: Verificar restricciones antes de comprobar eventos
                    const restriccion = verificarRestriccionesHorario(slotInicio, slotFin, pista.restricciones);

                    if (!restriccion) { // Si no hay restricciones, verificar eventos
                        const eventos = await GoogleCalendarService.getEvents(
                            pista.id,
                            slotInicio.toISOString(),
                            slotFin.toISOString()
                        );

                        if (!eventos || eventos.length === 0) {
                            const reservaPayload = {
                                pista: pista.name,
                                inicio: slotInicio.toISOString(),
                                fin: slotFin.toISOString(),
                                nombre,
                                numero,
                                partida,
                                nivel,
                                jugadores_faltan
                            };

                            const urlReserva = `${DOMINIO_FRONTEND}/confirmar-reserva?data=${encodeURIComponent(JSON.stringify(reservaPayload))}`;
                            let enlace;
                            if (NODE_ENV === 'production') {
                                enlace = await shortenUrl(urlReserva);
                            } else {
                                enlace = urlReserva;
                            }

                            alternativas.push({
                                pista: pista.name,
                                inicio: slotInicio.toISOString(),
                                fin: slotFin.toISOString(),
                                enlace
                            });
                        }
                    }
                }
                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
            }
        }
    }

    // Ordenar por cercanía temporal y limitar a 3
    alternativas.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    return alternativas.slice(0, 3);
}
async function actualizarPartidaConNuevoJugador(eventId, calendarId, nombreInvitado, numeroInvitado, tipoUnion) {
    try {
        // 1. Obtener evento actual
        const evento = await GoogleCalendarService.getEvent(calendarId, eventId);

        // 2. Extraer información actual
        const descripcion = evento.description || "";
        const infoMap = {};
        descripcion.split('\n').forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':', 2);
                infoMap[key.trim()] = value.trim();
            }
        });

        // 3. Actualizar contadores
        const jugadoresActuales = parseInt(infoMap['Nº Actuales'] || '1') + 1;
        const jugadoresFaltan = parseInt(infoMap['Nº Faltantes'] || '0') - 1;

        // 4. Buscar espacio libre para el nuevo jugador
        let posicionLibre = 0;
        for (let i = 2; i <= 4; i++) {
            if (!infoMap[`Jugador ${i}`] || infoMap[`Jugador ${i}`].trim() === '') {
                posicionLibre = i;
                break;
            }
        }

        if (posicionLibre === 0) {
            throw new Error("No hay espacio para más jugadores.");
        }

        // 5. Preparar nueva descripción
        const lineas = descripcion.split('\n');
        const nuevasLineas = lineas.map(line => {
            if (line.startsWith('Nº Actuales:')) {
                return `Nº Actuales: ${jugadoresActuales}`;
            } else if (line.startsWith('Nº Faltantes:')) {
                return `Nº Faltantes: ${jugadoresFaltan}`;
            } else if (line.startsWith(`Jugador ${posicionLibre}:`)) {
                return `Jugador ${posicionLibre}: ${nombreInvitado}`;
            } else if (line.startsWith(`Telefono ${posicionLibre}:`) && tipoUnion === 'new') {
                return `Telefono ${posicionLibre}: ${numeroInvitado}`;
            }
            return line;
        });

        // 6. Actualizar evento en Google Calendar
        await GoogleCalendarService.updateEvent(calendarId, eventId, {
            description: nuevasLineas.join('\n')
        });

        // 7. Actualizar registro en base de datos utilizando el modelo
        try {
            await ReservasModel.updateWithNewPlayer(
                eventId,
                posicionLibre,
                nombreInvitado,
                numeroInvitado,
                jugadoresActuales,
                jugadoresFaltan,
                tipoUnion
            );
        } catch (dbError) {
            console.error("Error al actualizar la base de datos:", dbError);
            // No lanzamos el error porque ya actualizamos Google Calendar
        }

        return true;
    } catch (error) {
        console.error("Error al actualizar partida con nuevo jugador:", error);
        throw error;
    }
}

// Añadir esta función helper para buscar partidas abiertas en una fecha
async function buscarPartidasAbiertas(fecha) {
    const partidas = [];
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    console.log(`🔍 Buscando partidas abiertas entre ${fechaInicio.toISOString()} y ${fechaFin.toISOString()}`);

    // Obtener la hora actual para filtrar partidas pasadas
    const ahora = new Date();
    console.log(`⏰ Hora actual: ${ahora.toISOString()}`);

    // Obtener solo calendarios activos
    const calendariosFiltrados = await obtenerCalendariosActivos();
    console.log(`📅 Consultando ${calendariosFiltrados.length} calendarios activos para partidas abiertas`);

    for (const pista of calendariosFiltrados) {
        console.log(`- Consultando pista ${pista.name} (ID: ${pista.id})`);

        try {
            // Obtener todos los eventos del día para esta pista
            const eventos = await GoogleCalendarService.getEvents(
                pista.id,
                fechaInicio.toISOString(),
                fechaFin.toISOString()
            );

            console.log(`  • Encontrados ${eventos?.length || 0} eventos para ${pista.name}`);

            if (eventos && eventos.length > 0) {
                // Filtrar eventos que son partidas abiertas
                for (const evento of eventos) {
                    console.log(`  • Analizando evento: "${evento.summary}" (${evento.id})`);

                    // Verificar si el evento ya pasó
                    const inicioEvento = new Date(evento.start.dateTime);
                    if (inicioEvento <= ahora) {
                        console.log(`    ⏰ PARTIDA PASADA: ${inicioEvento.toLocaleTimeString('es-ES')} - No se muestra`);
                        continue; // Saltar esta partida porque ya pasó
                    }

                    const descripcion = evento.description || "";

                    // Verificar si la descripción contiene la información esperada
                    if (!descripcion.includes('Nº Faltantes')) {
                        console.log(`    ❌ El evento no parece ser una partida (no tiene 'Nº Faltantes')`);
                        continue;
                    }

                    // Extraer información del evento
                    const infoMap = {};
                    descripcion.split('\n').forEach(line => {
                        if (line.includes(':')) {
                            const [key, value] = line.split(':', 2);
                            infoMap[key.trim()] = value.trim();
                        }
                    });

                    console.log(`    📋 Datos extraídos: Estado=${infoMap['Estado'] || 'No definido'}, Nº Faltantes=${infoMap['Nº Faltantes'] || '0'}`);

                    // Verificar si es una partida abierta con jugadores faltantes
                    const jugadoresFaltanStr = infoMap['Nº Faltantes'] || '0';
                    const jugadoresFaltan = parseInt(jugadoresFaltanStr);
                    const estadoPartida = infoMap['Estado'] || '';

                    console.log(`    👥 Jugadores faltantes: ${jugadoresFaltan}, Estado: ${estadoPartida}`);

                    // Considerar una partida como abierta si faltan jugadores O si el estado es "Abierta"
                    if (jugadoresFaltan > 0 || estadoPartida.toLowerCase() === 'abierta') {
                        const fin = new Date(evento.end.dateTime);
                        console.log(`    ✅ PARTIDA ABIERTA ENCONTRADA: ${inicioEvento.toLocaleTimeString('es-ES')} a ${fin.toLocaleTimeString('es-ES')}`);

                        partidas.push({
                            tipo: 'abierta', // Tipo correcto que espera el frontend
                            pista: pista.name,
                            inicio: evento.start.dateTime,
                            fin: evento.end.dateTime,
                            eventId: evento.id,
                            calendarId: pista.id,
                            organizador: infoMap['Jugador Principal'] || '',
                            nivel: infoMap['Nivel'] || '',
                            jugadoresActuales: parseInt(infoMap['Nº Actuales'] || '1'),
                            jugadoresFaltantes: jugadoresFaltan,
                            idPartida: infoMap['ID'] || '',
                            descripcion: infoMap['descripcion'] || '',
                            colorId: evento.colorId || '0'
                        });
                    } else {
                        console.log(`    ❌ No es partida abierta (jugadores faltantes = ${jugadoresFaltan}, estado = ${estadoPartida})`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error al consultar eventos para pista ${pista.name}:`, error);
        }
    }

    console.log(`🎾 Total de partidas abiertas encontradas: ${partidas.length}`);
    return partidas;
}

async function obtenerCalendariosActivos(clubId = CLUB_ID) {
    try {
        const clubsModel = new ClubsModel();
        const configCalendarios = await clubsModel.getCalendarConfigFromSettings(clubId);

        if (!configCalendarios || !configCalendarios.calendars) {
            console.log("No se encontró configuración de calendarios activos, usando configuración por defecto");
            return CALENDARS.filter(cal => cal.avaliable !== false).map(cal => ({
                ...cal,
                restricciones: [] // Añadir array de restricciones vacío
            }));
        }

        // IMPORTANTE: Verificar que las restricciones existen antes de devolverlas
        const calendarsWithRestrictions = configCalendarios.calendars.map(cal => {
            if (!cal.restricciones) {
                console.log(`⚠️ Calendario ${cal.name} sin array de restricciones, inicializando array vacío`);
                cal.restricciones = [];
            } else {
                console.log(`✅ Calendario ${cal.name}: ${cal.restricciones.length} restricciones encontradas`);
            }
            return cal;
        });

        return calendarsWithRestrictions.filter(cal => cal.avaliable !== false);
    } catch (error) {
        console.error("Error al obtener calendarios activos:", error);
        return CALENDARS.filter(cal => cal.avaliable !== false).map(cal => ({
            ...cal,
            restricciones: [] // Añadir array de restricciones vacío
        }));
    }
}