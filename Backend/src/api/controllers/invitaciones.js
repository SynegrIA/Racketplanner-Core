import { validateInvitacion } from '../../schemas/invitacion.js';
import { shortenUrl } from '../services/acortarURL.js';
import { enviarMensajeWhatsApp } from '../services/builderBot.js';
import { DOMINIO_FRONTEND } from '../../config/config.js';

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

            // 2. Generar URL de invitación
            const urlCorta = `${DOMINIO_FRONTEND}/unir-jugador-reserva` +
                `?eventId=${encodeURIComponent(data.eventId)}` +
                `&nombre=${encodeURIComponent(data.nombre)}` +
                `&numero=${encodeURIComponent(data.numero)}` +
                `&calendarId=${encodeURIComponent(data.calendarId)}` +
                `&action=new`;

            // 3. Acortar la URL usando el servicio existente
            //const urlCorta = await shortenUrl(urlLarga);

            // 4. Formatear la fecha para mostrar en el mensaje
            let fechaObj;
            if (typeof data.fecha === 'string' && data.fecha.includes('/')) {
                // Convertir fecha en formato DD/MM/YYYY HH:MM:SS
                const [datePart, timePart] = data.fecha.split(' ');
                const [day, month, year] = datePart.split('/');
                const [hours, minutes, seconds] = timePart ? timePart.split(':') : [0, 0, 0];

                fechaObj = new Date(year, month - 1, day, hours, minutes, seconds);
            } else {
                fechaObj = new Date(data.fecha);
            }

            const fechaLegible = fechaObj.toLocaleString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            // 5. Crear mensaje de invitación
            const mensaje = `¡Hola *${data.nombre}*! \r\r` +
                `Te invitamos a unirte a la partida (Nivel: *${data.nivel}*) ` +
                `que ha creado *${data.jugadorCrea}*.` +
                `\rFecha y hora: *${fechaLegible}* \r\r` +
                `Para confirmar tu participación, haz clic en el siguiente enlace:\r` +
                `👉 ${urlCorta} \r\r` +
                `¡Te esperamos!`;

            // 6. Enviar mensaje usando el servicio de WhatsApp existente
            await enviarMensajeWhatsApp(mensaje, data.numero);

            // 7. Devolver respuesta exitosa
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