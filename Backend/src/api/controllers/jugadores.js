import { enviarMensajeWhatsApp } from "../services/builderBot.js";
import { JugadoresModel } from "../../models/jugadores.js";

export class JugadoresController {

    static async modificarPreferenciasJugador(req, res) {
        const { telefono, notificaciones, frecuenciaSemanal, preferenciaHoraria } = req.body;

        // 1. Validación de entrada
        if (!telefono) {
            return res.status(400).json({
                success: false,
                message: 'El número de teléfono es obligatorio para modificar las preferencias.'
            });
        }

        // 2. Construir el objeto de actualización solo con los campos proporcionados
        const updateData = {};
        if (notificaciones !== undefined) {
            updateData['Notificaciones'] = notificaciones;
        }
        if (frecuenciaSemanal !== undefined) {
            updateData['Máximo de invitaciones semanales'] = frecuenciaSemanal;
        }
        if (preferenciaHoraria) {
            updateData['Horario preferencia'] = preferenciaHoraria;
        }

        // Si no se proporciona ningún dato para actualizar, no hacemos nada.
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron preferencias para actualizar.'
            });
        }

        // 3. Llamar al modelo y manejar la respuesta
        try {
            const resultado = await JugadoresModel.updatePreferences(telefono, updateData);

            if (resultado.success) {
                await enviarMensajeWhatsApp("Tus preferencias han sido actualizadas correctamente.", telefono);
                return res.status(200).json({
                    success: true,
                    message: 'Preferencias del jugador actualizadas correctamente.',
                    data: resultado.data
                });
            } else {
                // Si el error es 'Jugador no encontrado', devolvemos un 404
                if (resultado.error === 'Jugador no encontrado') {
                    return res.status(404).json({
                        success: false,
                        message: 'No se encontró ningún jugador con el teléfono proporcionado.'
                    });
                }
                // Para otros errores del modelo
                await enviarMensajeWhatsApp("Lo sentimos, ha ocurrido un error al intentar actualizar tus preferencias.", telefono);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar las preferencias.',
                    error: resultado.error
                });
            }
        } catch (error) {
            await enviarMensajeWhatsApp("Lo sentimos, ha ocurrido un error en el sistema. Por favor, inténtalo de nuevo más tarde.", telefono);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor.',
                error: error.message
            });
        }
    }

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
                await enviarMensajeWhatsApp("Ha habido un error eliminando tus datos del sistema, vuelva a intentarlo más tarde", telefono)

                return res.status(404).json({
                    success: false,
                    message: 'Error al eliminar el jugador',
                    error: resultado.error
                });
            }
        } catch (error) {
            await enviarMensajeWhatsApp("Ha habido un error eliminando tus datos del sistema, vuelva a intentarlo más tarde", telefono)

            return res.status(500).json({
                success: false,
                message: 'Error del servidor',
                error: error.message
            });
        }
    }

}