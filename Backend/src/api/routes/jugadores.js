import express from 'express';
import { JugadoresController } from '../controllers/jugadores.js'

const jugadoresRouter = express.Router();

jugadoresRouter.delete("/:telefono", JugadoresController.eliminarJugador)
jugadoresRouter.patch("/modificar-preferencias", JugadoresController.modificarPreferenciasJugador)

export default jugadoresRouter;