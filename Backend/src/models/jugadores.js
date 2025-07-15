import { supabase } from '../api/services/supabase.js'

export class JugadoresModel {

    static async updatePreferences(telefono, preferences) {
        try {
            const { data, error } = await supabase
                .from('Jugadores')
                .update(preferences)
                .eq('Teléfono', telefono)
                .select();

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                return { success: true, data: data[0] };
            } else {
                return { success: false, error: 'Jugador no encontrado' };
            }

        } catch (error) {
            console.error('Error al actualizar preferencias del jugador:', error);
            return { success: false, error: error.message };
        }
    }

    static async delete(telefono) {
        try {
            const { data, error } = await supabase
                .from('Jugadores')
                .delete()
                .eq('Teléfono', telefono);

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error al eliminar jugador:', error);
            return { success: false, error: error.message };
        }
    }

}