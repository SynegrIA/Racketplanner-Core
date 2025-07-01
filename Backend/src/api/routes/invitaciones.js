import express from 'express';
import { InvitacionesController } from '../controllers/invitaciones.js';

const invitacionesRouter = express.Router();

invitacionesRouter.get("/", InvitacionesController.testing)

export default invitacionesRouter;