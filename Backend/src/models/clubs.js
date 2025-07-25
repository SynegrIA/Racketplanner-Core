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

            // Crear un mapa de las pistas configuradas por su índice para facilitar la búsqueda
            const pistasMap = new Map();
            pistasFiltradas.forEach(pista => {
                pistasMap.set(pista.id, pista);
            });

            // Actualizar los calendarios existentes manteniendo sus IDs de Google Calendar
            const calendars = DEFAULT_CALENDARS.map(calendar => {
                // Buscar la pista correspondiente por índice
                const pista = pistasMap.get(calendar.index);

                if (!pista) {
                    // Si no hay configuración específica para esta pista, devolver el calendario original
                    return calendar;
                }

                // Crear intervalos de tiempo para business hours
                const intervals = [];

                // Primer intervalo (siempre presente)
                if (pista.horario_inicio && pista.horario_fin) {
                    intervals.push({
                        start: pista.horario_inicio,
                        end: pista.horario_fin
                    });
                }

                // Segundo intervalo (si existe)
                if (pista.horario_inicio2 && pista.horario_fin2) {
                    intervals.push({
                        start: pista.horario_inicio2,
                        end: pista.horario_fin2
                    });
                }

                // Si no hay intervalos definidos, usar los horarios actuales del calendario
                const businessHoursIntervals = intervals.length > 0 ? intervals :
                    (calendar.businessHours?.weekdays || [{ start: "09:00", end: "22:00" }]);

                return {
                    ...calendar, // Mantener todas las propiedades originales (incluyendo el ID de Google Calendar)
                    name: pista.nombre || calendar.name, // Actualizar el nombre si está definido
                    businessHours: {
                        weekdays: businessHoursIntervals,
                        weekends: businessHoursIntervals
                    }
                };
            });

            // Generar business hours generales basados en la primera pista (si existe)
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