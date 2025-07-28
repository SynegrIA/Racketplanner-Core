import { supabase } from '../api/services/supabase.js'
import { CALENDARS as DEFAULT_CALENDARS } from '../config/calendars.js'

export class ClubsModel {

    async getCalendarConfigFromSettings(clubId) {
        try {
            console.log(`Obteniendo configuración de calendarios para club ${clubId}`);
            const { data, error } = await supabase
                .from('clubs')
                .select('settings')
                .eq('id', clubId)
                .single();

            if (error) {
                console.error('Error al obtener configuración del club:', error);
                return null;
            }

            if (!data || !data.settings || !data.settings.pistas) {
                console.warn('El club no tiene configuración de pistas definida');
                return null;
            }

            // Filtrar pistas activas
            const pistasFiltradas = data.settings.pistas.filter(pista => pista.activa !== false);
            console.log(`Encontradas ${pistasFiltradas.length} pistas activas`);

            // Crear un mapa de las pistas configuradas por su índice
            const pistasMap = new Map();
            pistasFiltradas.forEach(pista => {
                pistasMap.set(pista.id, pista);
                console.log(`Configuración de pista ${pista.id} (${pista.nombre}):`);
                console.log(`  Días laborables: ${pista.horario_inicio}-${pista.horario_fin} y ${pista.horario_inicio2 || 'N/A'}-${pista.horario_fin2 || 'N/A'}`);
                console.log(`  Fin de semana: ${pista.horario_inicio_fds}-${pista.horario_fin_fds}`);
                console.log(`  Duración de slot: ${pista.slotDuration || 90} minutos`);

                // Log de restricciones
                const restricciones = pista.restricciones || [];
                if (restricciones.length > 0) {
                    console.log(`  Restricciones: ${restricciones.length} configuradas`);
                    restricciones.forEach(r => {
                        console.log(`    - ${r.tipo} en ${r.dias.join(', ')} de ${r.hora_inicio} a ${r.hora_fin} - ${r.descripcion || 'Sin descripción'}`);
                    });
                }
            });

            // Actualizar los calendarios existentes manteniendo sus IDs
            const calendars = DEFAULT_CALENDARS.map(calendar => {
                // Buscar la pista correspondiente por índice
                const pista = pistasMap.get(calendar.index);

                if (!pista) {
                    // Si no hay configuración para esta pista, dejarla inactiva
                    return {
                        ...calendar,
                        avaliable: false
                    };
                }

                // DÍAS LABORABLES: Crear intervalos de tiempo
                const weekdayIntervals = [];

                // Primer intervalo (horario de mañana)
                if (pista.horario_inicio && pista.horario_fin) {
                    weekdayIntervals.push({
                        start: pista.horario_inicio,
                        end: pista.horario_fin
                    });
                }

                // Segundo intervalo (horario de tarde)
                if (pista.horario_inicio2 && pista.horario_fin2) {
                    weekdayIntervals.push({
                        start: pista.horario_inicio2,
                        end: pista.horario_fin2
                    });
                }

                // FIN DE SEMANA: Crear intervalos de tiempo
                const weekendIntervals = [];

                // Si hay horarios específicos de fin de semana
                if (pista.horario_inicio_fds && pista.horario_fin_fds) {
                    weekendIntervals.push({
                        start: pista.horario_inicio_fds,
                        end: pista.horario_fin_fds
                    });
                } else {
                    // Si no hay horarios de fin de semana, usar los mismos que los días laborables
                    weekdayIntervals.forEach(interval => {
                        weekendIntervals.push({ ...interval });
                    });
                }

                // Si no hay intervalos definidos, usar valores predeterminados
                const weekdayBusinessHours = weekdayIntervals.length > 0 ? weekdayIntervals :
                    (calendar.businessHours?.weekdays || [{ start: "09:00", end: "22:00" }]);

                const weekendBusinessHours = weekendIntervals.length > 0 ? weekendIntervals :
                    (calendar.businessHours?.weekends || [{ start: "09:00", end: "21:00" }]);

                console.log(`Configuración final para ${pista.nombre}:`);
                console.log(`  Días laborables: ${JSON.stringify(weekdayBusinessHours)}`);
                console.log(`  Fin de semana: ${JSON.stringify(weekendBusinessHours)}`);
                // Añadir log para duración del slot
                console.log(`  Duración de slot: ${pista.slotDuration || 90} minutos`);

                const restricciones = pista.restricciones || pista.restricicones || [];
                console.log(`⚠️ Pista ${pista.id}: Cargando ${restricciones.length} restricciones`);

                // Imprimir cada restricción para verificar
                if (restricciones && restricciones.length > 0) {
                    restricciones.forEach((r, idx) => {
                        console.log(`   - R${idx + 1}: ${r.tipo} en ${r.dias.join(', ')} de ${r.hora_inicio} a ${r.hora_fin}`);
                    });
                }

                return {
                    ...calendar,
                    name: pista.nombre || calendar.name,
                    businessHours: {
                        weekdays: weekdayBusinessHours,
                        weekends: weekendBusinessHours
                    },
                    // Añadir slotDuration desde la configuración, con valor predeterminado de 90 minutos
                    slotDuration: pista.slotDuration || 90,
                    // Mantener la pista como activa
                    avaliable: true,
                    restricciones: restricciones || []
                };
            });

            // Generar business hours generales basados en la primera pista
            let businessHours = null;
            let reservationDuration = 90; // Valor predeterminado

            if (calendars.length > 0) {
                businessHours = calendars[0].businessHours;
                // Usar la duración de la primera pista como duración general si está disponible
                reservationDuration = calendars[0].slotDuration || 90;
            }

            return {
                calendars,
                businessHours,
                reservationDuration
            };
        } catch (error) {
            console.error('Error al procesar configuración de calendarios:', error);
            return null;
        }
    }

}