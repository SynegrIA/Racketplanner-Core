import fetch from 'node-fetch'
import { BUILDERBOT_URL, BUILDERBOT_KEY } from '../../config/config.js'

export async function enviarMensajeWhatsApp(mensaje, numero) {
    await fetch(BUILDERBOT_URL, {
        method: 'POST',
        headers: {
            'x-api-builderbot': BUILDERBOT_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: { content: mensaje },
            number: numero
        })
    })
}