import { CALENDARS, BUSINESS_HOURS, RESERVATION_DURATION_MINUTES } from '../../config/calendars.js'
import { GoogleCalendarService } from '../../api/services/googleCalendar.js'
import { enviarMensajeWhatsApp } from '../../api/services/builderBot.js'
import { shortenUrl } from '../../api/services/acortarURL.js' // No se usa por el momento, no permite acortar rutas de "Localhost"
import { DOMINIO_FRONTEND } from '../../config/config.js'

export class ReservasController {

    static async agendar(req, res) {
        try {
            const { fecha_ISO, nombre, numero, partida, nivel, n_jugadores } = req.body
            const jugadores_faltan = n_jugadores

            // 1. Validación básica
            if (!fecha_ISO || !nombre || !numero) {
                return res.status(400).json({
                    status: "error",
                    message: "Los campos 'fecha_ISO', 'nombre' y 'numero' son obligatorios."
                })
            }

            // 2. Parsear fecha_ISO y validar
            const startDate = new Date(fecha_ISO)
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    status: "error",
                    message: "La fecha_ISO proporcionada no es válida."
                })
            }

            // 3. Buscar slot exacto y disponibilidad
            const slotInfo = await buscarSlotDisponibleExacto(startDate)
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
                }
                const urlReserva = `${DOMINIO_FRONTEND}/confirmar-reserva?data=${encodeURIComponent(JSON.stringify(reservaPayload))}`
                const enlace = urlReserva //await shortenUrl(urlReserva)
                const mensaje = `✅ Hay disponibilidad para reservar el ${slotInfo.pista.name} el ${slotInfo.slotInicio.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}.\n\n[Haz clic aquí para confirmar la reserva](${enlace})`
                await enviarMensajeWhatsApp(mensaje, numero)
                return res.json({
                    status: "enlace_confirmacion",
                    message: mensaje,
                    enlace
                })
            }

            // 4. Si no hay disponibilidad exacta, buscar alternativas
            const alternativas = await buscarAlternativasSlots(startDate, nombre, numero, partida, nivel, jugadores_faltan)
            if (alternativas.length > 0) {
                const listaHorarios = alternativas.map(horario => {
                    const inicio = new Date(horario.inicio)
                    const fin = new Date(horario.fin)
                    const fechaInicioFormateada = inicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Madrid' })
                    const horaInicio = inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
                    const horaFin = fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
                    return `👉🏼 *El ${fechaInicioFormateada} de ${horaInicio} a ${horaFin} en ${horario.pista}*: [Haz clic para reservar](${horario.enlace})`
                }).join(' \n')

                const mensaje = `😔 No hay disponibilidad exacta en la hora seleccionada. Opciones alternativas:\n${listaHorarios}`
                await enviarMensajeWhatsApp(mensaje, numero)
                return res.json({
                    status: "alternativas",
                    message: mensaje,
                    alternativas
                })
            } else {
                const mensaje = "😔 Lo sentimos, no hay disponibilidad ni alternativas cercanas."
                await enviarMensajeWhatsApp(mensaje, numero)
                return res.json({
                    status: "nodisponible",
                    message: mensaje
                })
            }
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error.message
            })
        }
    }

    static async confirmarReserva(req, res) {
        try {
            const { pista, inicio, fin, nombre, numero, partida, nivel, jugadores_faltan } = req.body;

            // 1. Validación básica
            if (!pista || !inicio || !fin || !nombre || !numero) {
                return res.status(400).json({
                    status: "error",
                    message: "Los campos 'pista', 'inicio', 'fin', 'nombre' y 'numero' son obligatorios."
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
            const urlCancelarCorta = `${DOMINIO_FRONTEND}/reservas/cancelar?eventId=${encodeURIComponent(evento.id)}&calendarId=${encodeURIComponent(pistaConfig.id)}&numero=${encodeURIComponent(numero)}`;
            //const urlCancelarCorta = await shortenUrl(urlCancelar);

            const urlEliminarCorta = `${DOMINIO_FRONTEND}/reservas/eliminar-jugador?eventId=${encodeURIComponent(evento.id)}&numero=${encodeURIComponent(numero)}&nombreJugador=${encodeURIComponent(nombre)}&calendarId=${encodeURIComponent(pistaConfig.id)}`;
            //const urlEliminarCorta = await shortenUrl(urlEliminar);

            const urlInvitarCorta = `${DOMINIO_FRONTEND}/reservas/unirse-partida?eventId=${encodeURIComponent(evento.id)}&nombre=${encodeURIComponent(nombre)}&numero=${encodeURIComponent(numero)}`;
            //const urlInvitarCorta = await shortenUrl(urlInvitar);

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
            if (partida === "completa") {
                mensaje = `✅ ¡Tu reserva para ${nombre} ha sido confirmada!\n` +
                    `📅 Fecha: ${fechaFormateada}\n` +
                    `🕒 Hora: ${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })} - ${fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}\n` +
                    `🎾 Pista: ${pista}\n\n` +
                    `📱 Puedes cancelar tu reserva aquí: \n` +
                    `👉🏼 [Cancelar Reserva](${urlCancelarCorta})\n\n` +
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
            if (partida === "abierta") {
                const mensajeInvitacion = `👉🏼 Si deseas invitar a un jugador, envía este mensaje a la persona: [Unirse a Partida](${urlInvitarCorta})`;
                await enviarMensajeWhatsApp(mensajeInvitacion, numero);

                // Opcionalmente, aquí podríamos activar un flujo en n8n para buscar jugadores
                // Ejemplo: await fetch(N8N_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ idPartida, ...datos }) });
            }

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
}

// Helper: Busca si la hora coincide exactamente con un slot y si hay pista libre
async function buscarSlotDisponibleExacto(startDate) {
    const dia = startDate.getDay()
    const isWeekend = dia === 0 || dia === 6
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
                    } else {
                        return { pista, slotInicio, slotFin, disponible: false }
                    }
                }
                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000)
            }
        }
    }
    return null
}

// Helper: Busca los dos siguientes slots libres más cercanos a la intención del usuario
async function buscarAlternativasSlots(startDate, nombre, numero, partida, nivel, jugadores_faltan) {
    const alternativas = []
    const fechaBase = new Date(startDate)
    fechaBase.setSeconds(0, 0)
    const dia = fechaBase.getDay()
    const isWeekend = dia === 0 || dia === 6

    for (const pista of CALENDARS) {
        const horarios = isWeekend ? pista.businessHours.weekends : pista.businessHours.weekdays
        if (!horarios || horarios.length === 0) continue

        for (const rango of horarios) {
            const [startHour, startMinute] = rango.start.split(":").map(Number)
            const [endHour, endMinute] = rango.end.split(":").map(Number)
            let slotInicio = new Date(fechaBase)
            slotInicio.setHours(startHour, startMinute, 0, 0)
            let slotFinRango = new Date(fechaBase)
            slotFinRango.setHours(endHour, endMinute, 0, 0)
            if (endHour === 0 && endMinute === 0) slotFinRango.setHours(24, 0, 0, 0)

            while (slotInicio < slotFinRango) {
                let slotFin = new Date(slotInicio.getTime() + pista.slotDuration * 60000)
                if (slotFin > slotFinRango) break
                if (slotInicio > startDate) {
                    const eventos = await GoogleCalendarService.getEvents(
                        pista.id,
                        slotInicio.toISOString(),
                        slotFin.toISOString()
                    )
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
                        }
                        const urlReserva = `${DOMINIO_FRONTEND}/confirmar-reserva?data=${encodeURIComponent(JSON.stringify(reservaPayload))}`
                        const enlace = urlReserva//await shortenUrl(urlReserva)
                        alternativas.push({
                            pista: pista.name,
                            inicio: slotInicio.toISOString(),
                            fin: slotFin.toISOString(),
                            enlace
                        })
                    }
                }
                slotInicio = new Date(slotInicio.getTime() + pista.slotDuration * 60000)
            }
        }
    }
    // Ordenar por cercanía temporal y limitar a 2
    alternativas.sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
    return alternativas.slice(0, 2)
}