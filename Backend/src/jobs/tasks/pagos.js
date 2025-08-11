import { PagosModel } from '../../models/pagos.js';
import { ReservasModel } from '../../models/reservas.js';
import { capturePaymentIntent, cancelPaymentIntent } from '../../api/services/stripe.js';
import { enviarMensajeWhatsApp } from '../../api/services/builderBot.js';

function construirFechaPartida(reserva) {
    // Supone servidor con TZ=Europe/Madrid
    const fecha = reserva['Fecha ISO'];      // ej: 2025-08-07
    const hora = (reserva['Inicio'] || '00:00:00').slice(0, 8); // HH:mm:ss
    return new Date(`${fecha}T${hora}`);
}
function shouldCapture(reserva) {
    const inicio = construirFechaPartida(reserva);
    const now = new Date();
    const diffMin = (inicio - now) / 60000;
    const faltan = parseInt(reserva['Nº Faltantes'] || '0', 10);
    const completa = String(reserva['Estado'] || '').toLowerCase() === 'completa' || faltan <= 0;
    return completa && diffMin <= 15 && diffMin >= -120;
}
function shouldCancel(reserva) {
    const inicio = construirFechaPartida(reserva);
    const now = new Date();
    const faltan = parseInt(reserva['Nº Faltantes'] || '0', 10);
    const completa = String(reserva['Estado'] || '').toLowerCase() === 'completa' || faltan <= 0;
    return now > inicio && !completa;
}

export async function procesarCapturasPagos() {
    const pagos = await PagosModel.listarAutorizadosPendientes();
    for (const pago of pagos) {
        const reserva = await ReservasModel.getByEventId(pago['ID Event']);
        if (!reserva) continue;

        const pi = pago.stripe_payment_intent_id;
        if (!pi) continue;

        try {
            if (shouldCapture(reserva)) {
                await capturePaymentIntent(pi);
                await PagosModel.marcarCapturado(pi, { Estado: 'capturado', Cobrado: true });
                if (pago.jugador_telefono) {
                    await enviarMensajeWhatsApp('pagos.capturado', pago.jugador_telefono, { idPartida: pago['ID Partida'] });
                }
            } else if (shouldCancel(reserva)) {
                await cancelPaymentIntent(pi);
                await PagosModel.marcarCancelado(pi, { Estado: 'cancelado' });
                if (pago.jugador_telefono) {
                    await enviarMensajeWhatsApp('pagos.cancelado', pago.jugador_telefono, { idPartida: pago['ID Partida'] });
                }
            }
        } catch (e) {
            console.error('Error procesando PI', pi, e);
        }
    }
}