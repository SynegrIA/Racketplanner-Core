import { enviarMensajeWhatsApp } from "../services/builderBot.js";
import { JugadoresModel } from "../../models/jugadores.js";
import { DOMINIO_FRONTEND } from "../../config/config.js";
import { shortenUrl } from "../services/acortarURL.js";

export class JugadoresController {

    static async getJugadorByNumber(req, res) {
        const { numero } = req.params;
        if (!numero) {
            return res.status(400).json({
                success: false,
                message: 'El número de teléfono es obligatorio'
            });
        }

        try {
            const jugador = await JugadoresModel.getJugador(numero);

            if (!jugador) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró ningún jugador con este número de teléfono'
                });
            }

            return res.status(200).json({
                success: true,
                data: jugador
            });

        } catch (error) {
            console.error('Error al buscar jugador por número:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor',
                error: error.message
            });
        }
    }

    static async registrarJugador(req, res) {
        const { nombre, telefono, nivel, notificaciones, frecuenciaSemanal, preferencias } = req.body;

        // 1. Validación de datos de entrada
        if (!nombre || !telefono || nivel === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios: nombre, teléfono y nivel son requeridos'
            });
        }

        try {
            // 2. Verificar si el jugador ya existe
            const jugadorExistente = await JugadoresModel.getJugador(telefono);

            if (jugadorExistente) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un jugador registrado con este número de teléfono'
                });
            }

            // 3. Preparar datos para la base de datos
            const horarioPreferencias = [];
            if (notificaciones && preferencias) {
                if (preferencias.mañana) horarioPreferencias.push("mañana");
                if (preferencias.tarde) horarioPreferencias.push("tarde");
                if (preferencias.noche) horarioPreferencias.push("noche");
            }
            const datosJugador = {
                'Nombre Real': nombre,
                'Teléfono': telefono,
                'Nivel': nivel,
                'Notificaciones': notificaciones !== undefined ? notificaciones : true,
                'Máximo de invitaciones semanales': notificaciones ? frecuenciaSemanal || 3 : 0,
                'Horario Preferencia': horarioPreferencias
            };

            // 4. Crear el jugador en la base de datos
            const resultado = await JugadoresModel.create(datosJugador);

            if (resultado.success) {
                // 5. Crear y acortar la URL de confirmación
                const urlCompleta = `${DOMINIO_FRONTEND}/confirmar-numero/${encodeURIComponent(telefono)}`;
                const urlAcortada = await shortenUrl(urlCompleta);

                // 6. Enviar mensaje de confirmación por WhatsApp con la URL acortada
                await enviarMensajeWhatsApp(
                    `¡Hola ${nombre}! Tu número se ha registrado en Racket Planner.\n\n🔵 Por favor, confirma tu registro haciendo clic en el siguiente enlace:\n${urlAcortada}\n\n⚠️ *IMPORTANTE*: Si no confirmas tu registro en los próximos 7 días, tus datos serán eliminados automáticamente del sistema.\n\nSi has recibido este mensaje por error o deseas eliminar tus datos, solo debes darme la orden y los eliminaré en un momento.`,
                    telefono
                );

                return res.status(201).json({
                    status: "success",
                    message: 'Jugador registrado correctamente',
                    data: resultado.data
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Error al registrar el jugador',
                    error: resultado.error
                });
            }


        } catch (error) {
            console.error('Error en el registro de jugador:', error);

            return res.status(500).json({
                success: false,
                message: 'Error del servidor',
                error: error.message
            });
        }
    }

    static async confirmarNumeroJugador(req, res) {
        const { numero } = req.params;

        if (!numero) {
            return res.status(400).json({
                success: false,
                message: 'El número de teléfono es obligatorio para confirmar el registro'
            });
        }

        try {
            // Primero verificamos que el jugador existe
            const jugador = await JugadoresModel.getJugador(numero);

            if (!jugador) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró ningún jugador con este número de teléfono'
                });
            }

            // Actualizamos el estado de confirmación del jugador
            const updateData = {
                'Número confirmado?': true
            };

            const resultado = await JugadoresModel.updatePreferences(numero, updateData);

            if (resultado.success) {
                // Enviar mensaje de confirmación por WhatsApp
                await enviarMensajeWhatsApp(
                    `¡Gracias ${jugador['Nombre Real']}! Tu número ha sido confirmado correctamente en Racket Planner. Ya puedes recibir invitaciones a partidas según tus preferencias.`,
                    numero
                );

                return res.status(200).json({
                    success: true,
                    message: 'Número de teléfono confirmado correctamente',
                    data: resultado.data
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Error al confirmar el número de teléfono',
                    error: resultado.error
                });
            }

        } catch (error) {
            console.error('Error al confirmar número de jugador:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor',
                error: error.message
            });
        }
    }

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
            updateData['Horario Preferencia'] = preferenciaHoraria;
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