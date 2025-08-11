import { supabase } from '../api/services/supabase.js';

export class PagosModel {
    static async create(payload) {
        const { error } = await supabase.from('Pagos').insert(payload);
        if (error) throw error;
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