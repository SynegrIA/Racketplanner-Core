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

    static async existePagoAutorizadoOrganizador(eventId, organizerPhone) {
        if (!eventId || !organizerPhone) return false;
        // Usamos una columna sin espacios para evitar el problema (no seleccionamos "ID Pago")
        // head:true + count:'exact' permite consulta ligera (solo COUNT) si tu versión soporta.
        let query = supabase
            .from('Pagos')
            .select('stripe_payment_intent_id', { count: 'exact', head: true })
            .eq('ID Event', eventId)
            .eq('jugador_telefono', organizerPhone)
            .in('Estado', ['autorizado', 'Autorizado', 'AUTORIZADO']); // por seguridad ante variaciones

        const { error, count } = await query;
        if (error) {
            console.error('[PagosModel.existePagoAutorizadoOrganizador] error', error);
            return false;
        }
        return (count && count > 0);
    }

    static async marcarAutorizadoPorSession(sessionId, updates = {}) {
        const { error } = await supabase
            .from('Pagos')
            .update({ ...updates })
            .eq('stripe_session_id', sessionId)
            .eq('Estado', 'pendiente');
        if (error) throw error;
    }

    static async findActivoPorReservaYTelefono(eventId, telefono) {
        const { data, error } = await supabase
            .from('Pagos')
            .select('stripe_session_url,stripe_session_id,created_at')
            .eq('ID Event', eventId)
            .eq('jugador_telefono', telefono)
            .in('Estado', ['pendiente', 'autorizado'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) return null;
        return data || null;
    }

}