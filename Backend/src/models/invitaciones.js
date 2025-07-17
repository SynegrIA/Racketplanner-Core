import { supabase } from '../api/services/supabase.js'

export class InvitacionesModel {

    static async create(invitacion) {
        const { data, error } = await supabase
            .from('Invitaciones')
            .insert([{
                ID_Partida: parseInt(invitacion.partidaId),
                'Nombre Jugador': invitacion.nombre,
                'Fecha Partida': invitacion.fecha,
                'Tiempo envio': new Date().toISOString(),
                'Telefono Jugador': invitacion.numero,
                'club_id': invitacion.clubId || null
            }])
            .select();

        if (error) throw new Error(`Error al crear la invitación: ${error.message}`);
        return data[0];
    }

}