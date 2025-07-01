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

}