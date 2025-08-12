import { supabase } from '../api/services/supabase.js';

export class PagosModel {

    static #ALLOWED_FIELDS = new Set([
        'Fecha ISO', 'Pista', 'Nivel', 'Nº Actuales', 'Nº Faltantes', 'Estado',
        'ID Event', 'Payment_Intent 1', 'Payment Intent 2', 'Payment Intent 3', 'Payment Intent 4',
        'Cobrado', 'ID Partida', 'club_id', 'Monto', 'jugador_id',
        'stripe_session_id', 'stripe_session_url', 'stripe_payment_intent_id',
        'jugador_telefono', 'jugador_nombre', 'Fecha Cobro', 'concepto', 'Fecha Recordatorio'
    ]);

    static #sanitize(payload) {
        const out = {};
        for (const [k, v] of Object.entries(payload || {})) {
            if (this.#ALLOWED_FIELDS.has(k)) out[k] = v;
        }
        return out;
    }

    static async create(payload) {
        const body = this.#sanitize(payload);
        const { data, error } = await supabase
            .from('Pagos')
            .insert(body)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Devuelve pagos autorizados listos para capturar (Estado=autorizado, Cobrado=false)
    static async listarAutorizadosPendientes() {
        const { data, error } = await supabase
            .from('Pagos')
            .select('*')
            .eq('Estado', 'autorizado')
            .eq('Cobrado', false);
        if (error) throw error;
        return data || [];
    }

    static async listarPendientesNoAutorizados() {
        const { data, error } = await supabase
            .from('Pagos')
            .select('*')
            .eq('Estado', 'pendiente');
        if (error) throw error;
        return data || [];
    }

    static async marcarCapturado(paymentIntentId, updates = {}) {
        const { error } = await supabase
            .from('Pagos')
            .update({ ...updates })
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

    static async marcarCanceladoPorId(idPago, updates = {}) {
        const { error } = await supabase
            .from('Pagos')
            .update({ ...updates })
            .eq('ID Pago', idPago);
        if (error) throw error;
    }

    static async cancelarTodosPorEvent(eventId) {
        const { error } = await supabase
            .from('Pagos')
            .update({ Estado: 'cancelado' })
            .eq('ID Event', eventId)
            .in('Estado', ['pendiente', 'autorizado']);
        if (error) throw error;
    }

    static async marcarRecordatorio(idPago) {
        const { error } = await supabase
            .from('Pagos')
            .update({ "Fecha Recordatorio": new Date().toISOString() })
            .eq('ID Pago', idPago);
        if (error) throw error;
    }

    static async findActivoPorReservaYTelefono(eventId, telefono) {
        const { data, error } = await supabase
            .from('Pagos')
            .select('*')
            .eq('ID Event', eventId)
            .eq('jugador_telefono', telefono)
            .in('Estado', ['pendiente', 'autorizado'])
            .order('ID Pago', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) return null;
        return data || null;
    }
}