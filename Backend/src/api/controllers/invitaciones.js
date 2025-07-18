import { validateInvitacion } from '../../schemas/invitacion.js';
import { shortenUrl } from '../services/acortarURL.js';
import { enviarMensajeWhatsApp } from '../services/builderBot.js';
import { DOMINIO_FRONTEND, NODE_ENV } from '../../config/config.js';
import { InvitacionesModel } from '../../models/invitaciones.js';
import { GoogleCalendarService } from '../services/googleCalendar.js';

export class InvitacionesController {
    static async testing(req, res) {
        console.log("probando endpoint")
        return res.status(200).json({ message: "Todo okey" })
    }

    /**
     * Envía invitación a un jugador para unirse a una partida
     * @param {Request} req - Petición Express
     * @param {Response} res - Respuesta Express
     */
    static async invitarJugador(req, res) {
        try {
            // 1. Validar los datos de entrada usando el esquema Zod existente
            const validacion = validateInvitacion(req.body);
            if (!validacion.success) {
                return res.status(400).json({
                    success: false,
                    error: `Datos de invitación inválidos: ${validacion.error.errors.map(e => e.message).join(', ')}`
                });
            }

            const data = validacion.data;

            // 2. Generar URL de invitación con los datos correctos
            const urlLarga = `${DOMINIO_FRONTEND}/unir-jugador-reserva` +
                `?eventId=${encodeURIComponent(data.eventId)}` +
                `&nombre=${encodeURIComponent(data.jugadorCrea)}` +
                `&nombreinvitado=${encodeURIComponent(data.nombre)}` +
                `&numero=${encodeURIComponent(data.jugadorCreaNumero || '')}` +
                `&numeroinvitado=${encodeURIComponent(data.numero || '')}` +
                `&calendarId=${encodeURIComponent(data.calendarId)}` +
                `&action=new`;

            // 3. Acortar la URL usando el servicio existente
            let urlCorta;
            if (NODE_ENV == 'production') { urlCorta = await shortenUrl(urlLarga) } else { urlCorta = urlLarga }

            // 4. Obtener detalles completos del evento desde Google Calendar
            let fechaObj;

            // Si tenemos eventId y calendarId, obtener la información precisa del evento
            if (data.eventId && data.calendarId) {
                try {
                    const evento = await GoogleCalendarService.getEvent(data.calendarId, data.eventId);
                    if (evento && evento.start && evento.start.dateTime) {
                        // Usar la fecha y hora del evento de Google Calendar
                        fechaObj = new Date(evento.start.dateTime);
                    } else {
                        // Fallback: parsear la fecha proporcionada
                        fechaObj = new Date(data.fecha);
                    }
                } catch (error) {
                    console.error("Error al obtener evento de Google Calendar:", error);
                    // Fallback: parsear la fecha proporcionada
                    fechaObj = new Date(data.fecha);
                }
            } else if (typeof data.fecha === 'string' && data.fecha.includes('/')) {
                // Convertir fecha en formato DD/MM/YYYY HH:MM:SS
                const [datePart, timePart] = data.fecha.split(' ');
                const [day, month, year] = datePart.split('/');
                const [hours, minutes, seconds] = timePart ? timePart.split(':') : [0, 0, 0];

                fechaObj = new Date(year, month - 1, day, hours, minutes, seconds);
            } else {
                fechaObj = new Date(data.fecha);
            }

            // Separar fecha y hora con zona horaria específica
            const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Europe/Madrid'
            });

            const horaFormateada = fechaObj.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Madrid'
            });

            // 5. Crear mensaje de invitación
            const mensaje = `¡Hola *${data.nombre}*! \r\r` +
                `Te invitamos a unirte a la partida (Nivel: *${data.nivel}*) ` +
                `que ha creado *${data.jugadorCrea}*.` +
                `\rFecha: *${fechaFormateada}* \r` +
                `\rHora: *${horaFormateada}* \r\r` +
                `Para confirmar tu participación, haz clic en el siguiente enlace:\r` +
                `👉 ${urlCorta} \r\r` +
                `¡Te esperamos!`;

            // 6. Guardar la invitación en la base de datos
            await InvitacionesModel.create({
                partidaId: data.partidaId,
                nombre: data.nombre,
                fecha: fechaObj.toISOString().split('T')[0], // Formato YYYY-MM-DD
                numero: data.numero,
                clubId: req.body.clubId // Si existe un club_id en la solicitud
            });

            // 7. Enviar mensaje usando el servicio de WhatsApp existente
            await enviarMensajeWhatsApp(mensaje, data.numero);

            // 8. Devolver respuesta exitosa
            return res.status(200).json({
                success: true,
                message: `Invitación enviada a ${data.nombre} (${data.numero}).`
            });

        } catch (error) {
            console.error("Error al invitar jugador:", error);
            return res.status(500).json({
                success: false,
                error: error.message || "Error al enviar invitación"
            });
        }
    }
}