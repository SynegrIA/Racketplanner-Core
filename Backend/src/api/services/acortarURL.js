import fetch from 'node-fetch'
import { NODE_ENV, TINY_URL_API_KEY as TINYURL_API_TOKEN } from '../../config/config.js'

const TINYURL_CREATE_ENDPOINT = 'https://api.tinyurl.com/create'

/**
 * Acorta una URL usando TinyURL API v2.
 * opciones: { alias?, domain?, description?, tags?, expiresAt? }
 */
export async function shortenUrl(longUrl, opciones = {}) {
    if (!longUrl) throw new Error('No se proporcionó una URL para acortar.')
    if (NODE_ENV === 'development') return longUrl

    // Validación básica de URL
    try { new URL(longUrl) } catch { throw new Error('La URL proporcionada no es válida.') }

    if (!TINYURL_API_TOKEN) {
        throw new Error('Falta TINYURL_API_TOKEN en configuración.')
    }

    const {
        alias,
        domain = 'tinyurl.com',
        description,
        tags,
        expiresAt // ISO string o fecha
    } = opciones

    const payload = { url: longUrl, domain }
    if (alias) payload.alias = alias
    if (description) payload.description = description
    if (Array.isArray(tags) && tags.length) payload.tags = tags
    if (expiresAt) payload.expires_at = typeof expiresAt === 'string' ? expiresAt : new Date(expiresAt).toISOString()

    try {
        const resp = await fetch(TINYURL_CREATE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TINYURL_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const data = await resp.json().catch(() => ({}))

        if (!resp.ok) {
            const apiMsg = data?.errors?.map(e => e.message).join('; ') || data?.message || resp.statusText
            throw new Error(`TinyURL API error (${resp.status}): ${apiMsg}`)
        }

        const tiny = data?.data?.tiny_url || data?.tiny_url
        if (!tiny) throw new Error('Respuesta de TinyURL sin tiny_url.')
        return tiny
    } catch (error) {
        console.error('Error acortando URL (TinyURL v2):', error)
        throw new Error('No se pudo acortar la URL proporcionada.')
    }
}