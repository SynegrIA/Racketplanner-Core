import { ReservasModel } from '../../models/reservas.js';
import { JugadoresModel } from '../../models/jugadores.js';
import { createCheckoutSession, constructWebhookEvent } from '../services/stripe.js';
import { enviarMensajeWhatsApp } from '../services/builderBot.js';
import { PagosModel } from '../../models/pagos.js';

// Prorrateo basado en "Invité de X (n)"
function computeSharesFromReserva(reservaRow, totalAmountCents) {
    const nombres = [reservaRow['Jugador 1'], reservaRow['Jugador 2'], reservaRow['Jugador 3'], reservaRow['Jugador 4']];
    const telefonos = [reservaRow['Telefono 1'], reservaRow['Telefono 2'], reservaRow['Telefono 3'], reservaRow['Telefono 4']];
    const organizerName = nombres[0];
    const organizerPhone = telefonos[0];

    const shares = new Map();
    const addShare = (tel, nombre) => {
        if (!tel) return;
        const cur = shares.get(tel) || { telefono: tel, nombre, shareCount: 0 };
        cur.shareCount += 1;
        shares.set(tel, cur);
    };

    addShare(organizerPhone, organizerName);
    for (let i = 1; i < 4; i++) {
        const nombre = nombres[i];
        const tel = telefonos[i];
        if (!nombre) continue;

        const invitadoDeMatch = nombre.match(/^Invité de\s+(.+?)\s*\(\d+\)$/i);
        if (invitadoDeMatch && invitadoDeMatch[1].trim() === organizerName) {
            addShare(organizerPhone, organizerName);
            continue;
        }
        if (tel) addShare(tel, nombre);
        else addShare(organizerPhone, organizerName);
    }

    const pricePerShare = Math.round(totalAmountCents / 4);
    return Array.from(shares.values()).map(s => ({
        telefono: s.telefono,
        nombre: s.nombre,
        shareCount: s.shareCount,
        amountCents: s.shareCount * pricePerShare
    }));
}

export class PagosController {
    // POST /pagos/reserva/:eventId/generar
    static async generarLinksReserva(req, res) {
        try {
            const { eventId } = req.params;
            const { currency = 'EUR', totalAmountCents, enviar = true } = req.body;
            if (!eventId || !totalAmountCents) {
                return res.status(400).json({ status: 'error', message: 'eventId y totalAmountCents son obligatorios' });
            }

            const reserva = await ReservasModel.getByEventId(eventId);
            if (!reserva) return res.status(404).json({ status: 'error', message: 'Reserva no encontrada' });

            const partes = computeSharesFromReserva(reserva, totalAmountCents);

            const results = [];
            for (const parte of partes) {
                const existente = await PagosModel.findPendientePorReservaYTelefono(eventId, parte.telefono);
                if (existente?.stripe_session_url) {
                    results.push({ ...parte, url: existente.stripe_session_url, reused: true });
                    if (enviar) await enviarMensajeWhatsApp('pagos.link', parte.telefono, { enlace: existente.stripe_session_url });
                    continue;
                }

                const jugador = await JugadoresModel.getJugador(parte.telefono).catch(() => null);
                const email = jugador?.Email || jugador?.email || null;

                const metadata = {
                    eventId,
                    calendarId: reserva['calendarID'] || '',
                    idPartida: String(reserva['ID Partida'] || ''),
                    telefono: parte.telefono,
                    nombre: parte.nombre,
                    shareCount: String(parte.shareCount)
                };

                const session = await createCheckoutSession({
                    amount: parte.amountCents,
                    currency,
                    customer_email: email || undefined,
                    description: `Pago ${metadata.shareCount}/4 - Pista ${reserva['Pista']} - ${reserva['Fecha ISO']} ${reserva['Inicio']}`,
                    metadata
                });

                await PagosModel.create({
                    "ID Partida": reserva['ID Partida'],
                    "ID Event": eventId,
                    "Fecha ISO": reserva['Fecha ISO'],
                    "Pista": reserva['Pista'],
                    "Nivel": reserva['Nivel'],
                    "Monto": parte.amountCents / 100,
                    "Estado": 'pendiente',              // a la espera de completar checkout
                    "Cobrado": false,
                    "jugador_telefono": parte.telefono,
                    "jugador_nombre": parte.nombre,
                    "stripe_session_id": session.id,
                    "stripe_session_url": session.url,
                    "club_id": reserva['club_id'] || null,
                    "concepto": `Reserva ${reserva['ID Partida']}`
                });

                if (enviar) {
                    await enviarMensajeWhatsApp('pagos.link', parte.telefono, { enlace: session.url });
                }

                results.push({ ...parte, url: session.url, reused: false });
            }

            return res.json({ status: 'success', data: results });
        } catch (err) {
            console.error('Error generando links de pago:', err);
            return res.status(500).json({ status: 'error', message: 'Error al generar links de pago' });
        }
    }

    // POST /pagos/stripe/webhook
    static async stripeWebhook(req, res) {
        try {
            const signature = req.headers['stripe-signature'];
            const event = constructWebhookEvent(req.body, signature);

            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    // Al completar el checkout con capture_method=manual, el PI queda en requires_capture
                    await PagosModel.marcarAutorizadoPorSession(session.id, {
                        stripe_payment_intent_id: session.payment_intent,
                        Estado: 'autorizado' // equivalente a requires_capture
                    });
                    const tel = session.metadata?.telefono;
                    if (tel) await enviarMensajeWhatsApp('pagos.autorizado', tel, { idPartida: session.metadata?.idPartida });
                    break;
                }
                default:
                    break;
            }
            return res.status(200).send();
        } catch (err) {
            console.error('Stripe webhook error:', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
}