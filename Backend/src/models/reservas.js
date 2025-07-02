import { supabase } from '../api/services/supabase.js'

export class ReservasModel {

    static async create(object) {
        // object debe contener los campos necesarios para la tabla reservas
        const { data, error } = await supabase
            .from('Reservas')
            .insert([object])
            .select()
        if (error) throw new Error(error.message)
        return data[0]
    }

    static async delete(eventId) {
        // Buscar y eliminar la reserva por su ID de evento de Google Calendar
        const { data, error } = await supabase
            .from('Reservas')
            .delete()
            .match({ "ID Event": eventId })
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    }

}