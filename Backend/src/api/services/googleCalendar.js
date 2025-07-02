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
    }
}