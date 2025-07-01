import { shortenUrl } from '../services/acortarURL.js'

export class UtilsController {

    static async shortenUrl(req, res) {
        try {
            const { url } = req.body
            const shortUrl = await shortenUrl(url)
            res.json({ status: 'success', data: { originalUrl: url, shortUrl } })
        } catch (error) {
            res.status(400).json({ status: 'error', message: error.message })
        }
    }
}