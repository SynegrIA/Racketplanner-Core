import { supabase } from '../api/services/supabase.js';

export class PagosModel {

    static #ALLOWED_FIELDS = new Set([
        'Fecha ISO', 'Pista', 'Nivel', 'Nº Actuales', 'Nº Faltantes', 'Estado',
        'ID Event', 'Payment_Intent 1', 'Payment Intent 2', 'Payment Intent 3', 'Payment Intent 4',
        'Cobrado', 'ID Partida', 'club_id', 'Monto', 'jugador_id',
        // Nuevas columnas usadas por tu flujo
        'stripe_session_id', 'stripe_session_url', 'stripe_payment_intent_id',
        'jugador_telefono', 'jugador_nombre', 'Fecha Cobro', 'concepto'
    ]);

    static #sanitize(payload) {
        const out = {};
        for (const [k, v] of Object.entries(payload || {})) {
            if (this.#ALLOWED_FIELDS.has(k)) out[k] = v;
        }
        return out;
    }

    static async create(payload) {
        const toInsert = this.#sanitize(payload);
        const { data, error } = await supabase
            .from('Pagos')
            .insert(toInsert)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    static async findPendientePorReservaYTelefono(eventId, telefono) {
        const { data } = await supabase
            .from('Pagos')
            .select('*')
            .eq('ID Event', eventId)
            .eq('jugador_telefono', telefono)
            .eq('Estado', 'pendiente')
            .maybeSingle();
        return data || null;
    }
    static async marcarAutorizadoPorSession(sessionId, updates = {}) {
        const { error } = await supabase
            .from('Pagos')
            .update({ ...updates })
            .eq('stripe_session_id', sessionId);
        if (error) throw error;
    }
    static async listarAutorizadosPendientes() {
        const { data, error } = await supabase
            .from('Pagos')
            .select('*')
            .eq('Estado', 'autorizado')
            .eq('Cobrado', false);
        if (error) throw error;
        return data || [];
    }
    static async marcarCapturado(paymentIntentId, updates = {}) {
        const { error } = await supabase
            .from('Pagos')
            .update({ ...updates, "Fecha Cobro": new Date().toISOString() })
            .eq('stripe_payment_intent_id', paymentIntentId);
        if (error) throw error;
    }
    static async marcarCancelado(paymentIntentId, updates = {}) {
        const { error } = await supabase
            .from('Pagos')
            .update({ ...updates })
            .eq('stripe_payment_intent_id', paymentIntentId);
        if (error) throw error;
    }

}