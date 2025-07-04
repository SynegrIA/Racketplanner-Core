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

    // Nuevo método para actualizar reserva con nuevo jugador
    static async updateWithNewPlayer(eventId, posicionLibre, nombreInvitado, numeroInvitado, jugadoresActuales, jugadoresFaltan, tipoUnion) {
        try {
            // 1. Obtener el registro actual
            const { data, error } = await supabase
                .from('Reservas')
                .select('*')
                .eq('ID Event', eventId)
                .single();

            if (error) throw new Error(error.message);

            // 2. Preparar datos para actualización
            const actualizaciones = {
                "Nº Actuales": jugadoresActuales,
                "Nº Faltantes": jugadoresFaltan,
                "Fecha Actualización": new Date().toISOString(),
                "Actualización": `${nombreInvitado} se unió a la partida`,
                [`Jugador ${posicionLibre}`]: nombreInvitado
            };

            if (tipoUnion === 'new') {
                actualizaciones[`Telefono ${posicionLibre}`] = numeroInvitado;
            }

            // 3. Actualizar el registro
            const { error: updateError } = await supabase
                .from('Reservas')
                .update(actualizaciones)
                .eq('ID Event', eventId);

            if (updateError) throw new Error(updateError.message);

            return true;
        } catch (error) {
            console.error("Error al actualizar reserva con nuevo jugador:", error);
            throw error;
        }
    }

    // Añadir este método al final de la clase ReservasModel

    static async removePlayer(eventId, posicionJugador, jugadoresActuales, jugadoresFaltan, nombreJugador) {
        try {
            // 1. Preparar datos para actualización
            const actualizaciones = {
                "Nº Actuales": jugadoresActuales,
                "Nº Faltantes": jugadoresFaltan,
                "Fecha Actualización": new Date().toISOString(),
                "Actualización": `Se eliminó al jugador ${nombreJugador}`,
                [`Jugador ${posicionJugador}`]: null,
                [`Telefono ${posicionJugador}`]: null
            };

            // 2. Actualizar el registro
            const { data, error } = await supabase
                .from('Reservas')
                .update(actualizaciones)
                .eq('ID Event', eventId)
                .select();

            if (error) throw new Error(error.message);

            return data[0];
        } catch (error) {
            console.error("Error al eliminar jugador de reserva:", error);
            throw error;
        }
    }

    static async getReservasActivas(numeroTelefono) {
        try {
            const hoy = new Date();

            // Consultar reservas futuras
            const { data, error } = await supabase
                .from('Reservas')
                .select('*')
                .or(`"Telefono 1".eq.${numeroTelefono},"Telefono 2".eq.${numeroTelefono},"Telefono 3".eq.${numeroTelefono},"Telefono 4".eq.${numeroTelefono}`)
                .gt('Fecha ISO', hoy.toISOString().split('T')[0])
                .order('Fecha ISO', { ascending: true });

            if (error) throw new Error(error.message);

            const partidasCompletas = [];
            const partidasAbiertas = [];

            // Procesar los resultados
            data.forEach(row => {
                const fechaObj = new Date(`${row['Fecha ISO']}T${row['Inicio']}`);

                // Verificar si el usuario es el dueño de la reserva
                const esDuenio = row['Telefono 1'] === numeroTelefono;

                // Información básica común para ambos tipos de partidas
                const partidaInfo = {
                    idPartida: row['ID'] || '',
                    fechaLegible: fechaObj.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Madrid'
                    }).replace(',', ' a las'),
                    estado: row['Estado'],
                    linkCancel: row['Link Cancel'] || "",
                    esDuenio: esDuenio
                };

                // Separar según el estado
                if (row['Estado'] === 'Completa') {
                    partidasCompletas.push(partidaInfo);
                } else if (row['Estado'] === 'Abierta') {
                    // Añadir información adicional para partidas abiertas
                    partidaInfo.jugadoresActuales = row['Nº Actuales'] || 0;
                    partidaInfo.jugadoresFaltantes = row['Nº Faltantes'] || 0;
                    partidaInfo.linkJoin = row['Link Join'] || "";
                    partidaInfo.linkDelete = row['Link Delete'] || "";
                    partidasAbiertas.push(partidaInfo);
                }
            });

            return { partidasCompletas, partidasAbiertas };
        } catch (error) {
            console.error("Error al obtener reservas activas:", error);
            throw error;
        }
    }

}