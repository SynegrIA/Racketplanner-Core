import { CALENDARS, BUSINESS_HOURS, RESERVATION_DURATION_MINUTES } from '../../config/calendars.js'
import { GoogleCalendarService } from '../../api/services/googleCalendar.js'
import { enviarMensajeWhatsApp } from '../../api/services/builderBot.js'
import { shortenUrl } from '../../api/services/acortarURL.js' // No se usa por el momento, no permite acortar rutas de "Localhost"
import { DOMINIO_FRONTEND } from '../../config/config.js'
import { ReservasModel } from '../../models/reservas.js'
import { JugadoresModel } from '../../models/jugadores.js'
import { NODE_ENV } from '../../config/config.js'

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

                let enlace;
                if (NODE_ENV == 'production') {
                    enlace = await shortenUrl(urlReserva);
                } else {
                    enlace = urlReserva;
                }

                const mensaje = `✅ Hay disponibilidad para reservar el ${slotInfo.pista.name} el ${slotInfo.slotInicio.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}.\n\n[Haz clic aquí para confirmar la reserva](${enlace})`;
                await enviarMensajeWhatsApp(mensaje, numero);
                return res.json({
                    status: "enlace_confirmacion",
                    message: mensaje,
                    enlace
                });
            }

            // 2. Buscar alternativas en el MISMO horario pero en otras pistas
            const alternativasMismoHorario = await buscarAlternativasMismoHorario(startDate, nombre, numero, partida, nivel, jugadores_faltan);
            if (alternativasMismoHorario.length > 0) {
                const listaHorarios = alternativasMismoHorario.map(horario => {
                    const inicio = new Date(horario.inicio);
                    const fin = new Date(horario.fin);
                    const fechaInicioFormateada = inicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Madrid' });
                    const horaInicio = inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
                    const horaFin = fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
                    return `👉🏼 *El ${fechaInicioFormateada} de ${horaInicio} a ${horaFin} en ${horario.pista}*: [Haz clic para reservar](${horario.enlace})`;
                }).join(' \n');

                const mensaje = `😊 Hay otras pistas disponibles en la misma hora:\n${listaHorarios}`;
                await enviarMensajeWhatsApp(mensaje, numero);
                return res.json({
                    status: "alternativas_mismo_horario",
                    message: mensaje,
                    alternativas: alternativasMismoHorario
                });
            }

            // 3. Si no hay nada en el mismo horario, buscar alternativas en otros horarios
            const alternativas = await buscarAlternativasSlots(startDate, nombre, numero, partida, nivel, jugadores_faltan);
            if (alternativas.length > 0) {
                const listaHorarios = alternativas.map(horario => {
                    const inicio = new Date(horario.inicio);
                    const fin = new Date(horario.fin);
                    const fechaInicioFormateada = inicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Madrid' });
                    const horaInicio = inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
                    const horaFin = fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
                    return `👉🏼 *El ${fechaInicioFormateada} de ${horaInicio} a ${horaFin} en ${horario.pista}*: [Haz clic para reservar](${horario.enlace})`;
                }).join(' \n');

                const mensaje = `😔 No hay disponibilidad en la hora seleccionada. Opciones alternativas:\n${listaHorarios}`;
                await enviarMensajeWhatsApp(mensaje, numero);
                return res.json({
                    status: "alternativas",
                    message: mensaje,
                    alternativas
                });
            } else {
                const mensaje = "😔 Lo sentimos, no hay disponibilidad ni alternativas cercanas.";
                await enviarMensajeWhatsApp(mensaje, numero);
                return res.json({
                    status: "nodisponible",
                    message: mensaje
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
            if (!pista || !inicio || !fin || !nombre || !numero) {
                return res.status(400).json({
                    status: "error",
                    message: "Debes rellenar todos los campos para poder confirmar la reserva"
                });
            }

            // 2. Buscar el calendario de la pista
            const pistaConfig = CALENDARS.find(c => c.name === pista);
            if (!pistaConfig) {
                return res.status(400).json({
                    status: "error",
                    message: "Pista no encontrada."
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
                const mensaje = "😔 Lo sentimos, esta pista ya no está disponible.";
                await enviarMensajeWhatsApp(mensaje, numero);
                return res.status(409).json({
                    status: "error",
                    message: mensaje
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
Jugador Principal: ${nombre}
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
            const urlEliminar = `${DOMINIO_FRONTEND}/eliminar-jugador-reserva?eventId=${encodeURIComponent(evento.id)}&numero=${encodeURIComponent(numero)}&nombreJugador=${encodeURIComponent(nombre)}&calendarId=${encodeURIComponent(pistaConfig.id)}`;
            if (NODE_ENV == 'production') { urlEliminarCorta = await shortenUrl(urlEliminar) } else { urlEliminarCorta = urlEliminar }

            // En el método confirmarReserva, modificar la creación de la URL
            let urlInvitarCorta;
            const urlInvitar = `${DOMINIO_FRONTEND}/unir-jugador-reserva?eventId=${encodeURIComponent(evento.id)}&nombre=${encodeURIComponent(nombre)}&numero=${encodeURIComponent(numero)}&calendarId=${encodeURIComponent(pistaConfig.id)}`;
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
                    "Jugador 1": nombre,
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
            let mensaje;
            if (estado == "Completa") {
                mensaje = `✅ ¡Tu reserva para ${nombre} ha sido confirmada!\n` +
                    `📅 Fecha: ${fechaFormateada}\n` +
                    `🕒 Hora: ${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })} - ${fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}\n` +
                    `🎾 Pista: ${pista}\n\n` +
                    `📱 Puedes cancelar tu reserva aquí: \n` +
                    `👉🏼 [Cancelar Reserva](${urlCancelarCorta})\n\n` +
                    `🔄 Número de jugadores que faltan: ${jugadores_faltan}\n` +
                    `📈 Estado de la partida: completa\n\n` +
                    `🚫 Si deseas eliminar a algún invitado, pulsa aquí: [Eliminar Jugador sin Cancelar](${urlEliminarCorta}).`;
            } else {
                mensaje = `✅ ¡Tu reserva para ${nombre} ha sido confirmada!\n` +
                    `📅 Fecha: ${fechaFormateada}\n` +
                    `🕒 Hora: ${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })} - ${fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}\n` +
                    `🎾 Pista: ${pista}\n\n` +
                    `📱 Puedes cancelar tu reserva aquí: \n` +
                    `👉🏼 [Cancelar Reserva](${urlCancelarCorta})\n\n` +
                    `🔄 Número de jugadores que faltan: ${jugadores_faltan}\n` +
                    `📈 Estado de la partida: abierta\n\n` +
                    `🚫 Si deseas eliminar a algún invitado, pulsa aquí: [Eliminar Reserva sin Cancelar](${urlEliminarCorta}).`;
            }

            // 13. Enviar mensaje de confirmación
            await enviarMensajeWhatsApp(mensaje, numero);

            // 14. Enviar mensaje adicional con enlace para invitar si es partida abierta
            const mensajeInvitacion = `👉🏼 Si deseas invitar a un jugador, envía este mensaje a la persona: [Unirse a Partida](${urlInvitarCorta})`;
            await enviarMensajeWhatsApp(mensajeInvitacion, numero);

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
                    nombre,
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
            if (evento && evento.start && evento.start.dateTime) {
                const fechaEvento = new Date(evento.start.dateTime);
                const ahora = new Date();
                const diffHoras = (fechaEvento - ahora) / (1000 * 60 * 60);

                if (diffHoras < 5) {
                    return res.status(400).json({
                        status: "error",
                        message: "Solo se pueden cancelar reservas con al menos 5 horas de antelación."
                    });
                }
            }

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
            let mensajeConfirmacion = "✅ Tu reserva ha sido cancelada con éxito.";

            if (evento) {
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

                mensajeConfirmacion = `✅ Tu reserva ha sido cancelada con éxito.\n\n` +
                    `📅 Detalles de la reserva cancelada:\n` +
                    `📆 Fecha: ${fechaFormateada}\n` +
                    `🕒 Hora: ${horaInicio}\n` +
                    `🎾 Pista: ${pistaInfo || "No especificada"}`;

                if (motivo) {
                    mensajeConfirmacion += `\n\n📝 Motivo: "${motivo}"`;
                }
            }

            // 6. Enviar mensaje de WhatsApp si tenemos número
            if (numero) {
                try {
                    await enviarMensajeWhatsApp(mensajeConfirmacion, numero);
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
            const { eventId, nombreInvitado, numeroInvitado, organizador, numeroOrganizador, tipoUnion, calendarId } = req.body;

            // Validación básica
            if (!eventId || !calendarId) {
                return res.status(400).json({
                    status: "error",
                    message: "Los parámetros eventId y calendarId son obligatorios."
                });
            }

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

                // Construir mensaje detallado para el nuevo jugador
                const mensajeJugador = `✅ *¡Te has unido a la partida exitosamente!*\n\n` +
                    `📋 *Detalles de la partida*:\n` +
                    `🆔 ID Partida: ${infoMap['ID'] || 'No disponible'}\n` +
                    `📅 Fecha: ${fechaFormateada}\n` +
                    `⏰ Horario: ${horaInicio} - ${horaFin}\n` +
                    `🎾 Pista: ${infoMap['Pista'] || evento.summary || 'No especificada'}\n` +
                    `🏆 Nivel: ${infoMap['Nivel'] || 'No especificado'}\n` +
                    `👑 Organizador: ${infoMap['Jugador Principal'] || organizador || 'No especificado'}\n\n` +
                    `👥 *Jugadores* (${jugadoresActuales}/4):\n` +
                    `1. ${infoMap['Jugador Principal'] || 'Organizador'}\n` +
                    (infoMap['Jugador 2'] ? `2. ${infoMap['Jugador 2']}\n` : '') +
                    (infoMap['Jugador 3'] ? `3. ${infoMap['Jugador 3']}\n` : '') +
                    (infoMap['Jugador 4'] ? `4. ${infoMap['Jugador 4']}\n` : '') +
                    (jugadoresFaltantesActualizados > 0 ?
                        `\n⚠️ Aún faltan ${jugadoresFaltantesActualizados} jugador(es)\n` :
                        `\n✅ ¡La partida está completa!\n`) +
                    `\n🚫 Si necesitas cancelar tu participación: [Eliminarme de esta partida](${urlEliminarCorta})`;

                // Notificar al nuevo jugador con el mensaje detallado
                await enviarMensajeWhatsApp(mensajeJugador, numeroInvitado);
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

                // Construir mensaje detallado
                const mensajeOrganizador = `✅ *¡Nuevo jugador en tu partida!*\n\n` +
                    `👤 *${nombreInvitado}* se ha unido a tu partida con los siguientes detalles:\n\n` +
                    `🆔 ID Partida: ${infoMap['ID'] || 'No disponible'}\n` +
                    `📅 Fecha: ${fechaFormateada}\n` +
                    `⏰ Horario: ${horaInicio} - ${horaFin}\n` +
                    `🎾 Pista: ${infoMap['Pista'] || evento.summary || 'No especificada'}\n` +
                    `🏆 Nivel: ${infoMap['Nivel'] || 'No especificado'}\n` +
                    (jugadoresFaltantesActualizados > 0 ?
                        `⚠️ Aún faltan ${jugadoresFaltantesActualizados} jugador(es)\n` :
                        `✅ ¡Partida completa!\n`);

                await enviarMensajeWhatsApp(mensajeOrganizador, telefono);
            }

            return res.json({
                status: "success",
                message: tipoUnion === "new"
                    ? "Te has unido a la partida. Recibirás notificaciones por WhatsApp."
                    : "Te has unido a la partida como invitado."
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

                    const mensaje = `⚠️ Actualización de partida\n\n` +
                        `El jugador ${nombreJugador} ha sido eliminado de tu partida.\n\n` +
                        `📅 Fecha: ${fechaFormateada}\n` +
                        `⏰ Hora: ${horaEvento}\n` +
                        `🎾 Pista: ${infoMap['Pista'] || "No especificada"}\n\n` +
                        `👥 Jugadores actuales: ${jugadoresActuales}/4\n` +
                        `👥 Jugadores faltantes: ${jugadoresFaltan}`;

                    await enviarMensajeWhatsApp(mensaje, organizadorNumero);
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

                    const mensaje = `ℹ️ Has sido eliminado de una partida\n\n` +
                        `${organizadorNombre} te ha eliminado de la siguiente partida:\n\n` +
                        `📅 Fecha: ${fechaFormateada}\n` +
                        `⏰ Hora: ${horaEvento}\n` +
                        `🎾 Pista: ${infoMap['Pista'] || "No especificada"}\n\n` +
                        `Si crees que es un error, por favor contacta con el organizador.`;

                    await enviarMensajeWhatsApp(mensaje, telefonoJugador);
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

    // Añadir este método a la clase ReservasController
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
            let mensajeFinal = `🎾 ¡Hola *${nombre || 'jugador'}*! 🎾\n`;
            mensajeFinal += `Estas son tus próximas partidas:\n\n`;

            // PARTIDAS COMPLETAS
            if (partidasCompletas.length > 0) {
                mensajeFinal += `✅ *PARTIDAS COMPLETAS:*\n`;
                partidasCompletas.forEach(info => {
                    mensajeFinal += `━━━━━━━━━━━━━━━\n`;
                    mensajeFinal += `🏸 ID: *${info.idPartida}*\n`;
                    mensajeFinal += `📅 Fecha: ${info.fechaLegible}\n`;
                    mensajeFinal += `🔵 Estado: ${info.estado}\n`;

                    // Solo mostrar link de cancelar si es el jugador principal
                    if (info.esDuenio) {
                        mensajeFinal += `❌ Cancelar: ${info.linkCancel}\n`;
                        mensajeFinal += `👑 _Eres el jugador principal_\n`;
                    }
                    mensajeFinal += `\n`;
                });
            } else {
                mensajeFinal += `📝 No hay partidas completas programadas.\n\n`;
            }

            // PARTIDAS ABIERTAS
            if (partidasAbiertas.length > 0) {
                mensajeFinal += `🔄 *PARTIDAS ABIERTAS:*\n`;
                partidasAbiertas.forEach(info => {
                    mensajeFinal += `━━━━━━━━━━━━━━━\n`;
                    mensajeFinal += `🏸 ID: *${info.idPartida}*\n`;
                    mensajeFinal += `📅 Fecha: ${info.fechaLegible}\n`;
                    mensajeFinal += `🔵 Estado: ${info.estado}\n`;
                    mensajeFinal += `👥 Jugadores: ${info.jugadoresActuales}\n`;
                    mensajeFinal += `⭐ Faltan: ${info.jugadoresFaltantes}\n`;

                    // Solo mostrar links si es el jugador principal
                    if (info.esDuenio) {
                        mensajeFinal += `✅ Unirse: ${info.linkJoin}\n`;
                        mensajeFinal += `🚫 Eliminar: ${info.linkDelete}\n`;
                        mensajeFinal += `❌ Cancelar: ${info.linkCancel}\n`;
                        mensajeFinal += `👑 _Eres el jugador principal_\n`;
                    }
                    mensajeFinal += `\n`;
                });
            } else {
                mensajeFinal += `📝 No hay partidas abiertas disponibles.\n\n`;
            }

            mensajeFinal += `🏆 ¡Que disfrutes del juego! 🎾`;

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





// NUEVA FUNCIÓN HELPER: Busca todos los slots disponibles en un día
async function buscarTodosLosSlotsDisponibles(fecha) {
    const slots = [];
    const dia = fecha.getDay();
    const isWeekend = dia === 0 || dia === 6;

    const ahora = new Date()

    for (const pista of CALENDARS) {
        const horarios = isWeekend ? pista.businessHours.weekends : pista.businessHours.weekdays;
        if (!horarios || horarios.length === 0) continue;

        for (const rango of horarios) {
            const [startHour, startMinute] = rango.start.split(":").map(Number);
            const [endHour, endMinute] = rango.end.split(":").map(Number);

            // Crear fechas consistentemente en la zona horaria local
            let slotInicio = new Date(fecha);
            slotInicio.setHours(startHour, startMinute, 0, 0);

            let slotFinRango = new Date(fecha);
            slotFinRango.setHours(endHour, endMinute, 0, 0);

            // Ajustar correctamente la medianoche
            if (endHour === 0 && endMinute === 0) {
                slotFinRango.setDate(slotFinRango.getDate() + 1);
            }


            while (slotInicio < slotFinRango) {
                const slotFin = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
                if (slotFin > slotFinRango) break;

                // Solo considerar slots futuros
                if (slotInicio > ahora) {
                    const eventos = await GoogleCalendarService.getEvents(
                        pista.id,
                        slotInicio.toISOString(),
                        slotFin.toISOString()
                    );

                    if (!eventos || eventos.length === 0) {
                        slots.push({
                            pista: pista.name,
                            inicio: slotInicio.toISOString(),
                            fin: slotFin.toISOString(),
                        });
                    }
                }
                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
            }
        }
    }
    // Ordenar por hora de inicio
    return slots.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
}

// Helper: Busca si la hora coincide exactamente con un slot y si hay pista libre
async function buscarSlotDisponibleExacto(startDate) {
    const dia = startDate.getDay()
    const isWeekend = dia === 0 || dia === 6

    // Para cada pista, comprobar si el horario solicitado está disponible
    for (const pista of CALENDARS) {
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
                    // Comprobar si está libre
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

    // Para cada pista, comprobar si el horario solicitado está disponible
    for (const pista of CALENDARS) {
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
                        if (NODE_ENV == 'production') {
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

    for (const pista of CALENDARS) {
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
                        if (NODE_ENV == 'production') {
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
                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000);
            }
        }
    }

    // Ordenar por cercanía temporal y limitar a 3 (aumentamos a 3 para mostrar más opciones)
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
    const dia = fecha.getDay();
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    // Buscar en todos los calendarios (todas las pistas)
    for (const pista of CALENDARS) {
        // Obtener todos los eventos del día para esta pista
        const eventos = await GoogleCalendarService.getEvents(
            pista.id,
            fechaInicio.toISOString(),
            fechaFin.toISOString()
        );

        if (eventos && eventos.length > 0) {
            // Filtrar eventos que son partidas abiertas
            for (const evento of eventos) {
                const descripcion = evento.description || "";

                // Extraer información del evento
                const infoMap = {};
                descripcion.split('\n').forEach(line => {
                    if (line.includes(':')) {
                        const [key, value] = line.split(':', 2);
                        infoMap[key.trim()] = value.trim();
                    }
                });

                // Verificar si es una partida abierta con jugadores faltantes
                const jugadoresFaltan = parseInt(infoMap['Nº Faltantes'] || '0');
                if (jugadoresFaltan > 0) {
                    partidas.push({
                        eventId: evento.id,
                        calendarId: pista.id,
                        pista: pista.name,
                        inicio: evento.start.dateTime,
                        fin: evento.end.dateTime,
                        tipo: 'abierta',
                        nivel: infoMap['Nivel'] || '',
                        organizador: infoMap['Jugador Principal'] || '',
                        jugadoresActuales: infoMap['Nº Actuales'] || '1',
                        jugadoresFaltan: jugadoresFaltan
                    });
                }
            }
        }
    }

    return partidas;
}