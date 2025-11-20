import fetch from 'node-fetch'
import { NODE_ENV } from '../../config/config.js'

const ISGD_CREATE_ENDPOINT = 'https://is.gd/create.php'

/**
 * Acorta una URL usando is.gd API.
 * No requiere API Key.
 */
export async function shortenUrl(longUrl) {
    if (!longUrl) throw new Error('No se proporcionó una URL para acortar.')
    if (NODE_ENV === 'development') return longUrl

    // Validación básica de URL
    try { new URL(longUrl) } catch { throw new Error('La URL proporcionada no es válida.') }

    try {
        // is.gd usa una petición GET simple: https://is.gd/create.php?format=json&url=...
        const url = `${ISGD_CREATE_ENDPOINT}?format=json&url=${encodeURIComponent(longUrl)}`
        
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        const data = await resp.json().catch(() => ({}))

        if (!resp.ok || data.errorcode) {
            const apiMsg = data.errormessage || resp.statusText
            throw new Error(`is.gd API error: ${apiMsg}`)
        }

        const shortUrl = data.shorturl
        if (!shortUrl) throw new Error('Respuesta de is.gd sin shorturl.')
        
        return shortUrl
    } catch (error) {
        console.error('Error acortando URL (is.gd):', error)
        // En caso de fallo, devolvemos la URL original para no romper el flujo
        return longUrl
    }
}