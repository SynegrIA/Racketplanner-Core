import { supabase } from '../api/services/supabase.js'

export class JugadoresModel {

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