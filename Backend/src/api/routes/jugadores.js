import express from 'express';
import { JugadoresController } from '../controllers/jugadores.js'

const jugadoresRouter = express.Router();

jugadoresRouter.post("/new", JugadoresController.registrarJugador)
jugadoresRouter.delete("/:telefono", JugadoresController.eliminarJugador)
jugadoresRouter.patch("/preferencias-invitaciones", JugadoresController.modificarPreferenciasJugador)

export default jugadoresRouter;