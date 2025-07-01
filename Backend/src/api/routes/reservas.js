import express from 'express';
import { ReservasController } from '../controllers/reservas.js'

const reservasRouter = express.Router();

reservasRouter.post("/agendar", ReservasController.agendar)
reservasRouter.post("/confirmar", ReservasController.confirmarReserva)

export default reservasRouter;