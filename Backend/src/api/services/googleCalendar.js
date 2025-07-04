import { google } from 'googleapis'
import { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } from '../../config/config.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar']

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth })

export const GoogleCalendarService = {

    async getEvents(calendarId, timeMin, timeMax) {
        const res = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime'
        })
        return res.data.items
    },

    async getEvent(calendarId, eventId) {
        try {
            const res = await calendar.events.get({
                calendarId,
                eventId
            });
            return res.data;
        } catch (error) {
            console.error("Error al obtener evento de Google Calendar:", error);
            throw error;
        }
    },

    async createEvent(calendarId, event) {
        const res = await calendar.events.insert({
            calendarId,
            resource: event
        })
        return res.data
    },

    // Añadir este método al objeto GoogleCalendarService
    async updateEvent(calendarId, eventId, eventData) {
        try {
            const res = await calendar.events.patch({
                calendarId,
                eventId,
                resource: eventData
            });
            return res.data;
        } catch (error) {
            console.error("Error al actualizar evento en Google Calendar:", error);
            throw error;
        }
    },

    async deleteEvent(calendarId, eventId) {
        try {
            // Registrar la intención para facilitar depuración
            console.log(`Intentando eliminar evento: ID=${eventId} del calendario: ID=${calendarId}`);

            const res = await calendar.events.delete({
                calendarId,
                eventId,
                sendUpdates: 'all' // Notificar a los participantes sobre la eliminación
            });

            console.log(`Evento ${eventId} eliminado con éxito`);
            return { success: true };
        } catch (error) {
            console.error("Error detallado al eliminar evento:", error);

            // Manejar errores específicos
            if (error.response) {
                console.error(`Código de error: ${error.response.status}`);
                console.error(`Mensaje API: ${JSON.stringify(error.response.data)}`);

                // Si el evento ya no existe, considerarlo como eliminado exitosamente
                if (error.response.status === 404) {
                    console.log("El evento ya no existe, se considera eliminado correctamente");
                    return { success: true, alreadyDeleted: true };
                }
            }

            throw error;
        }
    }

}