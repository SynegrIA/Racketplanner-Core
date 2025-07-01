import { google } from 'googleapis'
import dotenv from 'dotenv'

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/calendar']

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

    async createEvent(calendarId, event) {
        const res = await calendar.events.insert({
            calendarId,
            resource: event
        })
        return res.data
    }
}