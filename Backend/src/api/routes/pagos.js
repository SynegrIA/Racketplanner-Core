import { Router } from 'express';
import { PagosController } from '../controllers/pagos.js';

const pagosRouter = Router();

pagosRouter.post('/reserva/:eventId/generar', PagosController.generarLinksReserva);

export default pagosRouter