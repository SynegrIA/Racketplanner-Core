import fetch from 'node-fetch'
import { PagosModel } from '../../models/pagos.js';
import { ReservasModel } from '../../models/reservas.js';
import { capturePaymentIntent, cancelPaymentIntent } from '../../api/services/stripe.js';
import { enviarMensajeWhatsApp } from '../../api/services/builderBot.js';
import { GoogleCalendarService } from '../../api/services/googleCalendar.js';

const SELF_BASE_URL = process.env.SELF_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const MOTIVO = 'Organizador no autorizó el pago en los primeros 15 minutos';
const MINUTOS_AUTORIZACION_INICIAL = 15;

export async function enforceAutorizacionInicial() {
    try {
        const ahora = new Date();
        // Mejor: método que devuelva solo abiertas
        const abiertas = await ReservasModel.getAllReservas()

        if (!abiertas?.length) return;

        for (const r of abiertas) {
            try {
                const estado = (r['Estado'] || '').toLowerCase();
                if (estado !== 'abierta') continue; // solo abiertas

                // Intentar timestamp fiable
                let rawCreacion = r['created_at'] || r['Created_At'] || r['Fecha Creación TS'] ||
                    r['Fecha Creación'] || r['Fecha Creacion'];
                if (!rawCreacion) continue;

                // Ignorar si es solo fecha (YYYY-MM-DD) sin hora
                if (rawCreacion.length === 10 && !rawCreacion.includes('T')) {
                    // No tenemos hora -> no aplicamos enforcement para evitar falsos positivos
                    continue;
                }

                const createdAt = new Date(rawCreacion);
                if (isNaN(createdAt.getTime())) continue;

                let mins = (ahora - createdAt) / 60000;

                // (Opcional) Si quieres basarlo en la creación del pago del organizador:
                const organizerPhone = r['Telefono 1'] || r['Teléfono 1'] || r['Telefono'] || r['Teléfono'];
                if (!organizerPhone) continue;

                // Comprobar si ya autorizó
                const autorizado = await PagosModel.existePagoAutorizadoOrganizador(r['ID Event'], organizerPhone);
                if (autorizado) continue;

                // Intentar obtener pago pendiente del organizador para usar su created_at (lo hace más justo)
                const pagoOrgPend = await PagosModel.findActivoPorReservaYTelefono(r['ID Event'], organizerPhone);
                if (pagoOrgPend?.created_at) {
                    const pagoCreated = new Date(pagoOrgPend.created_at);
                    if (!isNaN(pagoCreated.getTime())) {
                        mins = (ahora - pagoCreated) / 60000;
                    }
                } else {
                    // Si todavía NO se generó ni el pago pendiente, le damos más tiempo: no cancelar aún
                    // (Descomenta si quieres forzar que exista el link antes de contar)
                    // continue;
                }

                if (mins < MINUTOS_AUTORIZACION_INICIAL - 0.2) continue; // aún dentro del margen

                const eventId = r['ID Event'];
                const calendarId = r['calendarID'];
                if (!eventId || !calendarId) continue;

                // Construir URL correcta (ver prefijo /api según tu app.use)
                const base = SELF_BASE_URL.replace(/\/+$/, '');
                const url = `${base}/reservas/cancelar/${encodeURIComponent(eventId)}`
                    + `?calendarId=${encodeURIComponent(calendarId)}`
                    + `&numero=${encodeURIComponent(organizerPhone)}`
                    + `&motivo=${encodeURIComponent(MOTIVO)}`;

                let resp;
                try {
                    resp = await fetch(url, { method: 'DELETE' });
                } catch (httpErr) {
                    console.error('[enforceAutorizacionInicial] fetch error', httpErr);
                }

                if (!resp || !resp.ok) {
                    if (resp) {
                        const txt = await resp.text();
                        console.warn(`[enforceAutorizacionInicial] cancelarReserva ${resp.status} -> ${txt}`);
                    }
                    // Fallback manual
                    try { await GoogleCalendarService.deleteEvent(calendarId, eventId); } catch { }
                    try { await ReservasModel.markAsCancelled(eventId, MOTIVO); } catch { }
                } else {
                    console.log(`[enforceAutorizacionInicial] Cancelada reserva ${eventId} (sin autorización en ${mins.toFixed(1)}m).`);
                }

            } catch (resErr) {
                console.error('[enforceAutorizacionInicial] error reserva', resErr);
            }
        }
    } catch (e) {
        console.error('[enforceAutorizacionInicial] Error general', e);
    }
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

// Recordatorios y enforcement de autorizaciones pendientes
export async function recordarPagos() {
    try {
        const pendientes = await PagosModel.listarPendientesNoAutorizados();
        if (!pendientes.length) return;

        const ahora = new Date();
        const cacheReservas = new Map();

        for (const pago of pendientes) {
            const eventId = pago['ID Event'];
            if (!eventId) continue;

            let reserva = cacheReservas.get(eventId);
            if (!reserva) {
                reserva = await ReservasModel.getByEventId(eventId);
                if (reserva) cacheReservas.set(eventId, reserva);
            }
            if (!reserva) continue;

            const faltan = parseInt(reserva['Nº Faltantes'] || '0', 10);
            const completa = (reserva['Estado'] || '').toLowerCase() === 'completa' || faltan <= 0;
            if (!completa) continue; // solo aplica a reservas completas

            const fechaInicio = construirFechaPartidaLocal(reserva);
            if (isNaN(fechaInicio.getTime())) continue;

            const diffMs = fechaInicio - ahora;
            const diffHoras = diffMs / 3600000;
            const diffDias = diffHoras / 24;

            if (diffDias < 0 || diffDias > 7) continue; // fuera ventana 0..7 días

            const fechaRecAnterior = pago['Fecha Recordatorio'] ? new Date(pago['Fecha Recordatorio']) : null;
            const organizerPhone = reserva['Telefono 1'];
            const esOrganizador = organizerPhone && pago.jugador_telefono === organizerPhone;

            // Enforcement: queda menos de 3 días (estrictamente) y sigue pendiente
            if (diffDias < 3 && diffHoras > 0) {
                if (esOrganizador) {
                    await enforcementOrganizador(pago, reserva);
                    await PagosModel.cancelarTodosPorEvent(eventId);
                } else {
                    await enforcementJugador(pago, reserva, faltan);
                }
                await PagosModel.marcarCanceladoPorId(pago['ID Pago'], { Estado: esOrganizador ? 'cancelado' : 'expulsado' });
                continue;
            }

            // Recordatorios entre 7 y >3 días (cada 24h)
            if (diffDias <= 7 && diffDias >= 3) {
                const debe = !fechaRecAnterior || (ahora - fechaRecAnterior) >= 24 * 3600000;
                if (debe) {
                    await enviarRecordatorio(pago, reserva);
                }
                continue;
            }

            // Ventana 3..0 días (>=0 y <3) pero antes de enforcement (aquí ya hacemos enforcement directo, por lo que no entra)
        }
    } catch (e) {
        console.error('[recordarPagos] error general', e);
    }
}

async function enviarRecordatorio(pago, reserva) {
    if (!pago.jugador_telefono) return;
    try {
        await enviarMensajeWhatsApp('pagos.recordatorio.pendiente', pago.jugador_telefono, {
            idPartida: reserva['ID Partida']
        });
        await PagosModel.marcarRecordatorio(pago['ID Pago']);
    } catch (e) {
        console.error('Error enviando recordatorio', e);
    }
}

async function enforcementOrganizador(pago, reserva) {
    const eventId = pago['ID Event'];
    const calendarId = reserva['calendarID'];
    try {
        if (calendarId && eventId) {
            try {
                await GoogleCalendarService.deleteEvent(calendarId, eventId);
            } catch (e) {
                console.warn('deleteEvent (posible ya eliminado):', e.message);
            }
            try {
                await ReservasModel.markAsCancelled(eventId, 'No se autorizó el pago del organizador');
            } catch (e) {
                console.error('Error markAsCancelled', e);
            }
        }
        if (pago.jugador_telefono) {
            await enviarMensajeWhatsApp('pagos.recordatorio.organizador.enforcement', pago.jugador_telefono, {
                idPartida: reserva['ID Partida']
            });
        }
    } catch (e) {
        console.error('Enforcement organizador fallo', e);
    }
}

async function enforcementJugador(pago, reserva, faltan) {
    const eventId = pago['ID Event'];
    const calendarId = reserva['calendarID'];
    try {
        if (calendarId && eventId) {
            let evento;
            try {
                evento = await GoogleCalendarService.getEvent(calendarId, eventId);
            } catch (e) {
                console.error('getEvent fallo', e);
            }
            if (evento?.description) {
                const lineas = evento.description.split('\n');
                const telefonoNormalizado = (pago.jugador_telefono || '').trim();
                let posicion = 0;
                let nombreJugador = '';
                for (let i = 2; i <= 4; i++) {
                    const telLine = lineas.find(l => l.startsWith(`Telefono ${i}:`));
                    if (telLine && telLine.includes(telefonoNormalizado)) {
                        posicion = i;
                        const nombreLine = lineas.find(l => l.startsWith(`Jugador ${i}:`));
                        if (nombreLine) nombreJugador = nombreLine.split(':')[1].trim();
                        break;
                    }
                }
                if (posicion) {
                    const nuevas = lineas.map(l => {
                        if (l.startsWith(`Jugador ${posicion}:`)) return `Jugador ${posicion}: `;
                        if (l.startsWith(`Telefono ${posicion}:`)) return `Telefono ${posicion}: `;
                        if (l.startsWith('Nº Faltantes:')) {
                            const f = parseInt(l.split(':')[1]) || 0;
                            return `Nº Faltantes: ${f + 1}`;
                        }
                        if (l.startsWith('Nº Actuales:')) {
                            const a = parseInt(l.split(':')[1]) || 1;
                            return `Nº Actuales: ${Math.max(a - 1, 1)}`;
                        }
                        return l;
                    });
                    try {
                        await GoogleCalendarService.updateEvent(calendarId, eventId, {
                            description: nuevas.join('\n')
                        });
                    } catch (e) {
                        console.error('updateEvent expulsar fallo', e);
                    }
                    try {
                        const nuevosFaltan = faltan + 1;
                        const nuevosAct = (parseInt(reserva['Nº Actuales'] || '1', 10) - 1);
                        await ReservasModel.removePlayer(
                            eventId,
                            posicion,
                            nuevosAct,
                            nuevosFaltan,
                            nombreJugador || 'Jugador'
                        );
                    } catch (e) {
                        console.error('removePlayer fallo', e);
                    }
                }
            }
        }
        if (pago.jugador_telefono) {
            await enviarMensajeWhatsApp('pagos.recordatorio.jugador.enforcement', pago.jugador_telefono, {
                idPartida: reserva['ID Partida']
            });
        }
    } catch (e) {
        console.error('Enforcement jugador fallo', e);
    }
}

// Construcción de fecha en horario local (servidor Europe/Madrid)
function construirFechaPartidaLocal(reserva) {
    const fecha = reserva['Fecha ISO'];
    const hora = (reserva['Inicio'] || '00:00:00').slice(0, 8);
    if (!fecha) return new Date(NaN);
    const [y, m, d] = fecha.split('-').map(Number);
    const [hh, mm, ss] = hora.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, ss || 0);
}


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