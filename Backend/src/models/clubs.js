import { supabase } from '../api/services/supabase.js'
import { CALENDARS as DEFAULT_CALENDARS } from '../config/calendars.js'

export class ClubsModel {
    /**
     * Obtiene la configuración de calendarios desde la columna settings del club
     * manteniendo los IDs originales de Google Calendar
     * @param {string} clubId - ID del club
     * @returns {object} - Configuración de calendarios actualizada
     */
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
            });

            // Actualizar los calendarios existentes manteniendo sus IDs
            const calendars = DEFAULT_CALENDARS.map(calendar => {
                // Buscar la pista correspondiente por índice
                const pista = pistasMap.get(calendar.index);

                if (!pista) {
                    console.log(`No se encontró configuración para pista con índice ${calendar.index}, manteniendo valores por defecto`);
                    return calendar;
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
                    // Para fin de semana solo usamos un intervalo
                    weekendIntervals.push({
                        start: pista.horario_inicio_fds,
                        end: pista.horario_fin_fds
                    });
                } else {
                    // Si no hay horarios específicos de fin de semana, usar los de días laborables
                    if (pista.horario_inicio && pista.horario_fin) {
                        weekendIntervals.push({
                            start: pista.horario_inicio,
                            end: pista.horario_fin
                        });
                    }
                    if (pista.horario_inicio2 && pista.horario_fin2) {
                        weekendIntervals.push({
                            start: pista.horario_inicio2,
                            end: pista.horario_fin2
                        });
                    }
                }

                // Si no hay intervalos definidos, usar valores predeterminados
                const weekdayBusinessHours = weekdayIntervals.length > 0 ? weekdayIntervals :
                    (calendar.businessHours?.weekdays || [{ start: "09:00", end: "22:00" }]);

                const weekendBusinessHours = weekendIntervals.length > 0 ? weekendIntervals :
                    (calendar.businessHours?.weekends || [{ start: "09:00", end: "21:00" }]);

                console.log(`Configuración final para ${pista.nombre}:`);
                console.log(`  Días laborables: ${JSON.stringify(weekdayBusinessHours)}`);
                console.log(`  Fin de semana: ${JSON.stringify(weekendBusinessHours)}`);

                return {
                    ...calendar,
                    name: pista.nombre || calendar.name,
                    businessHours: {
                        weekdays: weekdayBusinessHours,
                        weekends: weekendBusinessHours
                    }
                };
            });

            // Generar business hours generales basados en la primera pista
            let businessHours = null;
            if (calendars.length > 0) {
                businessHours = calendars[0].businessHours;
            }

            return {
                calendars,
                businessHours,
                reservationDuration: 90
            };
        } catch (error) {
            console.error('Error al procesar configuración de calendarios:', error);
            return null;
        }
    }
}