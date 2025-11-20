import fetch from 'node-fetch'
import { NODE_ENV } from '../../config/config.js'

const DAGD_CREATE_ENDPOINT = 'https://da.gd/s'

/**
 * Acorta una URL usando da.gd API.
 * No requiere API Key.
 */
export async function shortenUrl(longUrl) {
    if (!longUrl) throw new Error('No se proporcionó una URL para acortar.')
    if (NODE_ENV === 'development') return longUrl

    // Validación básica de URL
    try { new URL(longUrl) } catch { throw new Error('La URL proporcionada no es válida.') }

    try {
        // da.gd usa una petición GET simple: https://da.gd/s?url=...
        // Devuelve texto plano con la URL acortada
        const url = `${DAGD_CREATE_ENDPOINT}?url=${encodeURIComponent(longUrl)}`
        
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RacketPlanner/1.0; +https://racketplanner.es)'
            }
        })

        if (!resp.ok) {
            throw new Error(`da.gd API error: ${resp.statusText}`)
        }

        const shortUrl = (await resp.text()).trim()
        
        if (!shortUrl || !shortUrl.startsWith('http')) {
             throw new Error('Respuesta de da.gd inválida.')
        }
        
        return shortUrl
    } catch (error) {
        console.error('Error acortando URL (da.gd):', error)
        // En caso de fallo, devolvemos la URL original para no romper el flujo
        return longUrl
    }
}