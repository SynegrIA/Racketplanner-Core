import express from 'express';
import { ReservasController } from '../controllers/reservas.js'

const reservasRouter = express.Router();

reservasRouter.get("/detalles", ReservasController.obtenerDetallesReserva)
reservasRouter.post("/agendar", ReservasController.agendar)
reservasRouter.post("/confirmar", ReservasController.confirmarReserva)
reservasRouter.delete("/cancelar/:eventId", ReservasController.cancelarReserva)

export default reservasRouter;