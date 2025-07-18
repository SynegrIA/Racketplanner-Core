import express from 'express';
import { JugadoresController } from '../controllers/jugadores.js'

const jugadoresRouter = express.Router();

jugadoresRouter.get("/:numero", JugadoresController.getJugadorByNumber)
jugadoresRouter.post("/new", JugadoresController.registrarJugador)
jugadoresRouter.patch("/confirmar-numero/:numero", JugadoresController.confirmarNumeroJugador)
jugadoresRouter.delete("/:telefono", JugadoresController.eliminarJugador)
jugadoresRouter.patch("/preferencias-invitaciones", JugadoresController.modificarPreferenciasJugador)

export default jugadoresRouter;