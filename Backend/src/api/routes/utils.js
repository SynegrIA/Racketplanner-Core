import express from 'express'
import { UtilsController } from '../controllers/utils.js'

const utilsRouter = express.Router()

utilsRouter.post('/acortarURL', UtilsController.shortenUrl)

export default utilsRouter;