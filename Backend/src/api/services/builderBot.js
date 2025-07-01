import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const BUILDERBOT_API_URL = process.env.BUILDERBOT_URL
const BUILDERBOT_API_KEY = process.env.BUILDERBOT_KEY

export async function enviarMensajeWhatsApp(mensaje, numero) {
    await fetch(BUILDERBOT_API_URL, {
        method: 'POST',
        headers: {
            'x-api-builderbot': BUILDERBOT_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: { content: mensaje },
            number: numero
        })
    })
}