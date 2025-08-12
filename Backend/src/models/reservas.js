import { supabase } from '../api/services/supabase.js'

export class ReservasModel {

    static async getByEventId(eventId) {
        const { data } = await supabase
            .from('Reservas')
            .select('*')
            .eq('ID Event', eventId)
            .single();
        return data || null;
    }

    static async create(object) {
        // object debe contener los campos necesarios para la tabla reservas
        const { data, error } = await supabase
            .from('Reservas')
            .insert([object])
            .select()
        if (error) throw new Error(error.message)
        return data[0]
    }

    static async markAsCancelled(eventId, motivo) {
        try {
            // Preparar datos de actualización
            const actualizaciones = {
                "Estado": "Cancelada",
                "Fecha Actualización": new Date().toISOString(),
                "Actualización": `Reserva cancelada${motivo ? `. Motivo: ${motivo}` : ""}`,
            };

            // Actualizar el registro en Supabase
            const { data, error } = await supabase
                .from('Reservas')
                .update(actualizaciones)
                .eq('ID Event', eventId)
                .select();

            if (error) throw new Error(error.message);
            return data[0];
        } catch (error) {
            console.error("Error al marcar reserva como cancelada:", error);
            throw error;
        }
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

            let estado = "Abierta";
            if (jugadoresFaltan == 0) {
                estado = "Completa"
            }

            // 2. Preparar datos para actualización
            const actualizaciones = {
                "Nº Actuales": jugadoresActuales,
                "Nº Faltantes": jugadoresFaltan,
                "Fecha Actualización": new Date().toISOString(),
                "Actualización": `${nombreInvitado} se unió a la partida`,
                "Estado": estado,
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
                "Estado": "Abierta",
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
            console.log(`Buscando reservas activas para número: ${numeroTelefono} (exactamente este formato)`);
            console.log(`Fecha de hoy (ISO): ${hoy.toISOString()}`);
            console.log(`Fecha de hoy (solo fecha): ${hoy.toISOString().split('T')[0]}`);

            // 1. PRIMERA CONSULTA - Buscar sin filtro de fecha para verificar si hay reservas con tu número
            const { data: reservasSinFiltroFecha, error: errorSinFiltro } = await supabase
                .from('Reservas')
                .select('ID, Fecha ISO, Estado, Telefono 1')
                .eq('Telefono 1', numeroTelefono);

            if (errorSinFiltro) {
                console.error("Error al buscar reservas sin filtro de fecha:", errorSinFiltro);
            } else {
                console.log(`Reservas con tu número (sin filtro de fecha): ${reservasSinFiltroFecha.length}`);
                reservasSinFiltroFecha.forEach(r => {
                    console.log(`- ID: ${r.ID}, Fecha: ${r['Fecha ISO']}, Estado: ${r.Estado}`);
                });
            }

            // 2. SEGUNDA CONSULTA - Verificar si el problema está en el filtro de fecha
            const { data: reservasConFiltroFecha, error: errorConFiltro } = await supabase
                .from('Reservas')
                .select('ID, Fecha ISO, Estado, Telefono 1')
                .eq('Telefono 1', numeroTelefono)
                .gte('Fecha ISO', hoy.toISOString().split('T')[0]); // Mayor o igual en lugar de mayor que

            if (errorConFiltro) {
                console.error("Error al buscar reservas con filtro de fecha:", errorConFiltro);
            } else {
                console.log(`Reservas futuras con tu número: ${reservasConFiltroFecha.length}`);
                reservasConFiltroFecha.forEach(r => {
                    console.log(`- ID: ${r.ID}, Fecha: ${r['Fecha ISO']}, Estado: ${r.Estado}`);
                });
            }

            // 3. TERCERA CONSULTA - Verificar si hay problemas con mayúsculas/minúsculas en los nombres de las columnas
            const { data: todasReservas, error: errorTodas } = await supabase
                .from('Reservas')
                .select('*')
                .limit(1);

            if (errorTodas) {
                console.error("Error al obtener estructura de tabla:", errorTodas);
            } else if (todasReservas.length > 0) {
                console.log("Estructura de la primera reserva (nombres de columnas):", Object.keys(todasReservas[0]));
            }

            // 4. CONSULTA PRINCIPAL - Con todos los filtros y selecciones necesarias
            const { data, error } = await supabase
                .from('Reservas')
                .select('*')
                .eq('Telefono 1', numeroTelefono)
                .gte('Fecha ISO', hoy.toISOString().split('T')[0])
                .order('Fecha ISO', { ascending: true });

            if (error) {
                console.error("Error en consulta principal:", error);
                throw new Error(error.message);
            }

            console.log(`Procesando ${data?.length || 0} reservas para formatear en la respuesta`);

            // Resto del código para formatear resultados
            const partidasCompletas = [];
            const partidasAbiertas = [];

            if (data && data.length > 0) {
                data.forEach(row => {
                    // ... código existente ...

                    try {
                        const fechaObj = new Date(`${row['Fecha ISO']}T${row['Inicio']}`);

                        // Separar fecha y hora correctamente
                        const fecha = fechaObj.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'Europe/Madrid'
                        });

                        const hora = fechaObj.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Europe/Madrid'
                        });

                        const estadoClave = row['Estado'] === 'Completa' ? 'estado_completa' :
                            row['Estado'] === 'Abierta' ? 'estado_abierta' : 'estado_otro';

                        // Información básica común
                        const partidaInfo = {
                            idPartida: row['ID Partida'] || '',
                            fecha: fecha, // Fecha separada
                            hora: hora,   // Hora separada
                            estadoClave: estadoClave,
                            estado: row['Estado'],
                            linkCancel: row['Link Cancel'] || "",
                            esDuenio: row['Telefono 1'] === numeroTelefono,
                            jugadoresActuales: row['Nº Actuales'] || 0,
                            jugadoresFaltantes: row['Nº Faltantes'] || 0,
                            linkJoin: row['Link Join'] || "",
                            linkDelete: row['Link Delete'] || ""
                        };

                        console.log(`  Info básica: ${JSON.stringify(partidaInfo)}`);

                        // Separar según el estado
                        if (row['Estado'] === 'Completa') {
                            partidasCompletas.push(partidaInfo);
                            console.log(`  ✅ Añadida a partidas completas con opciones de gestión`);
                        } else if (row['Estado'] === 'Abierta') {
                            partidasAbiertas.push(partidaInfo);
                            console.log(`  ✅ Añadida a partidas abiertas`);
                        } else {
                            console.log(`  ❌ Estado no reconocido: ${row['Estado']}`);
                        }
                    } catch (dateError) {
                        console.error(`  Error procesando fecha: ${dateError.message}`);
                    }
                });
            }

            console.log(`Resultado final: ${partidasCompletas.length} partidas completas, ${partidasAbiertas.length} partidas abiertas`);
            return { partidasCompletas, partidasAbiertas };
        } catch (error) {
            console.error("Error al obtener reservas activas:", error);
            throw error;
        }
    }

    static async getAllOpenReservas() {
        try {
            const { data, error } = await supabase
                .from('Reservas')
                .select('"ID Event", "calendarID"')
                .eq('Estado', 'Abierta');

            if (error) throw new Error(error.message);
            return data;
        } catch (error) {
            console.error("Error al obtener reservas abiertas:", error);
            throw error;
        }
    }

    static async getAllReservas() {
        const { data, error } = await supabase
            .from('Reservas')
            .select('*')
            .in('Estado', ['Abierta', 'Completa'])
            .not('ID Event', 'is', null);
        if (error) throw error;
        return data || [];
    }

}