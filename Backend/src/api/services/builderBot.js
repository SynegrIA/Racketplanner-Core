// import fetch from 'node-fetch'
// import { BUILDERBOT_URL, BUILDERBOT_KEY } from '../../config/config.js'

// export async function enviarMensajeWhatsApp(mensaje, numero) {
//     await fetch(BUILDERBOT_URL, {
//         method: 'POST',
//         headers: {
//             'x-api-builderbot': BUILDERBOT_KEY,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             messages: { content: mensaje },
//             number: numero
//         })
//     })
// }

import fetch from 'node-fetch'
import { BUILDERBOT_URL, BUILDERBOT_KEY } from '../../config/config.js'
import i18nService from './i18n.js'

/**
 * Envía un mensaje a WhatsApp
 * @param {string} mensaje - Mensaje o clave de traducción a enviar
 * @param {string} numero - Número de teléfono del destinatario
 * @param {Object} params - Parámetros para interpolar en el mensaje si es una clave
 * @returns {Promise<void>}
 */
export async function enviarMensajeWhatsApp(mensaje, numero, params = {}) {
    // Si el mensaje parece ser una clave de traducción (contiene puntos y no tiene espacios)
    const mensajeFinal = mensaje.includes('.') && !mensaje.includes(' ')
        ? i18nService.translate(mensaje, params)
        : mensaje;

    await fetch(BUILDERBOT_URL, {
        method: 'POST',
        headers: {
            'x-api-builderbot': BUILDERBOT_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: { content: mensajeFinal },
            number: numero
        })
    })
}