import { supabase } from '../../api/services/supabase.js'

/**
 * Tarea para mantener activa la base de datos de Supabase
 * Previene la pausa automática del tier gratuito por inactividad
 */
export const keepAlive = async () => {
    try {
        // Query mínima para mantener la conexión activa
        const { data, error } = await supabase
            .from('Jugadores')
            .select('count')
            .limit(1)
        
        if (error) throw error
        
        console.log('✅ Keep-alive: Supabase activo')
    } catch (error) {
        console.error('❌ Keep-alive error:', error)
    }
}
