import express from 'express';
import { JugadoresController } from '../controllers/jugadores.js'

const jugadoresRouter = express.Router();

jugadoresRouter.delete("/:telefono", JugadoresController.eliminarJugador)

export default jugadoresRouter;