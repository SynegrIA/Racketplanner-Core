import { enviarMensajeWhatsApp } from "../services/builderBot";

export class JugadoresController {

    static async eliminarJugador(req, res) {
        const { telefono } = req.params;

        if (!telefono) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el teléfono para eliminar al jugador'
            });
        }

        try {
            const resultado = await JugadoresModel.delete(telefono);

            if (resultado.success) {
                await enviarMensajeWhatsApp("Tus datos han sido eliminados de nuestro sistema correctamente", telefono)

                return res.status(200).json({
                    success: true,
                    message: 'Jugador eliminado correctamente'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Error al eliminar el jugador',
                    error: resultado.error
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error del servidor',
                error: error.message
            });
        }
    }

}