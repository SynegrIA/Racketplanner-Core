import { Router } from 'express';
import { PagosController } from '../controllers/pagos.js';

const pagosRouter = Router();

pagosRouter.post('/reserva/:eventId/generar', PagosController.generarLinksReserva);
// Importante: esta ruta debe usar express.raw en app principal
pagosRouter.post('/stripe/webhook', PagosController.stripeWebhook);

export default pagosRouter