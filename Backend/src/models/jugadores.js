import { supabase } from '../api/services/supabase.js'

export class JugadoresModel {

    static async getJugador(telefono) {
        try {
            // Limpieza básica del número de teléfono para garantizar formato consistente
            const telefonoNormalizado = telefono.trim().replace(/\s+/g, '');

            const { data, error } = await supabase
                .from('Jugadores')
                .select('*')
                .eq('Teléfono', telefonoNormalizado)
                .limit(1);

            if (error) {
                console.error('Error al recuperar el jugador:', error);
                throw error;
            }

            // Si hay datos y al menos un registro, el usuario existe
            return data[0]
        } catch (error) {
            console.error('Error al recuperar el jugador:', error);
            throw error;
        }
    }

    static async getJugadoresSinConfirmar() {
        try {

            const { data, error } = await supabase
                .from('Jugadores')
                .select('*')
                .eq('Número confirmado?', false)

            if (error) {
                console.error('Error recuperando jugadores sin confirmar', error)
                throw error
            }

            return data

        } catch (error) {
            console.error('Error al recuperar el jugador:', error);
            throw error;
        }
    }

    static async create(jugadorData) {
        try {
            const { data, error } = await supabase
                .from('Jugadores')
                .insert([jugadorData])
                .select();

            if (error) {
                console.error('Error al crear jugador:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error al crear jugador:', error);
            return { success: false, error: error.message };
        }
    }

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