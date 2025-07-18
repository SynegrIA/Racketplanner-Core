import fetch from 'node-fetch'
import { NODE_ENV } from '../../config/config.js'

const TINYURL_API = 'https://tinyurl.com/api-create.php'

export async function shortenUrl(longUrl) {
    if (!longUrl) throw new Error('No se proporcionó una URL para acortar.')

    if (NODE_ENV == "development") { return longUrl }

    const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w.,@?^=%&:/~+#\-]*[\w@?^=%&/~+#\-])?$/
    if (!urlPattern.test(longUrl)) throw new Error('La URL proporcionada no es válida.')

    try {
        const apiUrl = `${TINYURL_API}?url=${encodeURIComponent(longUrl)}`
        const response = await fetch(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const shortUrl = await response.text()
        if (!urlPattern.test(shortUrl)) throw new Error('Respuesta inválida de TinyURL')
        return shortUrl
    } catch (error) {
        console.error('Error acortando URL:', error)
        throw new Error('No se pudo acortar la URL proporcionada.')
    }
}