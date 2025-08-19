import { WHATSAPP_GROUPS, APP_LOCALE, CLUB_ID } from "../../config/config.js"
import { enviarMensajeWhatsApp } from "../../api/services/builderBot.js"
import { GoogleCalendarService } from "../../api/services/googleCalendar.js"
import { obtenerSlotsDisponiblesPorFecha, obtenerCalendariosActivos } from "../../api/controllers/reservas.js"

export const dailyUpdate = async () => {
    try {
        console.log('Ejecutando informe diario de slots y reservas...');

        // 1. Obtener la fecha de mañana
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        manana.setHours(0, 0, 0, 0);

        // 2. Formatear la fecha para mostrar en el mensaje
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];

        const diaClave = diasSemana[manana.getDay()];
        const mesClave = meses[manana.getMonth()];

        const diaTraducido = await enviarMensajeWhatsApp(`fecha.dias.${diaClave}`, '', {}, true);
        const mesTraducido = await enviarMensajeWhatsApp(`fecha.meses.${mesClave}`, '', {}, true);

        const fechaFormateada = `${diaTraducido} ${manana.getDate()} ${mesTraducido}`;

        // 3. Obtener todos los slots disponibles para mañana - usando la nueva función helper
        const slotsDisponibles = await obtenerSlotsDisponiblesPorFecha(manana);

        // 4. Obtener las reservas confirmadas para mañana
        const mananaFin = new Date(manana);
        mananaFin.setHours(23, 59, 59, 999);

        // Obtener eventos de todos los calendarios activos
        const calendariosFiltrados = await obtenerCalendariosActivos();
        const reservas = [];

        // Para cada pista, obtener sus reservas
        for (const pista of calendariosFiltrados) {
            try {
                const eventos = await GoogleCalendarService.getEvents(
                    pista.id,
                    manana.toISOString(),
                    mananaFin.toISOString()
                );

                if (eventos && eventos.length > 0) {
                    eventos.forEach(evento => {
                        // Extraer organizador del evento
                        let organizador = "";
                        if (evento.description) {
                            const lineas = evento.description.split('\n');
                            for (const linea of lineas) {
                                if (linea.startsWith('Jugador Principal:')) {
                                    organizador = linea.split(':')[1].trim();
                                    break;
                                }
                            }
                        }

                        // Extraer hora de inicio
                        const horaInicio = new Date(evento.start.dateTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Europe/Madrid'
                        });

                        reservas.push({
                            pista: pista.name,
                            horaInicio: horaInicio,
                            organizador: organizador || "Desconocido"
                        });
                    });
                }
            } catch (error) {
                console.error(`Error al obtener eventos para pista ${pista.name}:`, error);
            }
        }

        // 5. Agrupar slots disponibles por hora
        const slotsAgrupados = {};
        slotsDisponibles.forEach(slot => {
            const hora = new Date(slot.inicio).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Madrid'
            });

            if (!slotsAgrupados[hora]) {
                slotsAgrupados[hora] = 0;
            }
            slotsAgrupados[hora]++;
        });

        // 6. Agrupar reservas por pista
        const reservasPorPista = {};
        reservas.forEach(reserva => {
            if (!reservasPorPista[reserva.pista]) {
                reservasPorPista[reserva.pista] = [];
            }
            reservasPorPista[reserva.pista].push({
                hora: reserva.horaInicio,
                organizador: reserva.organizador
            });
        });

        // 7. Crear el mensaje para enviar
        const cabecera = await enviarMensajeWhatsApp('informeDiario.cabecera', '', {
            fecha: fechaFormateada
        }, true);

        let mensaje = cabecera + "\n\n";

        // Añadir sección de reservas confirmadas
        mensaje += await enviarMensajeWhatsApp('informeDiario.reservasConfirmadas', '', {}, true) + "\n\n";

        if (Object.keys(reservasPorPista).length > 0) {
            for (const pista of Object.keys(reservasPorPista).sort()) {
                mensaje += await enviarMensajeWhatsApp('informeDiario.pistaTitulo', '', { pista }, true) + "\n";

                // Ordenar reservas por hora
                const reservasOrdenadas = reservasPorPista[pista].sort((a, b) =>
                    a.hora.localeCompare(b.hora)
                );

                for (const reserva of reservasOrdenadas) {
                    mensaje += await enviarMensajeWhatsApp('informeDiario.reservaLinea', '', {
                        hora: reserva.hora,
                        organizador: reserva.organizador
                    }, true) + "\n";
                }
                mensaje += "\n";
            }
        } else {
            mensaje += await enviarMensajeWhatsApp('informeDiario.sinReservas', '', {}, true) + "\n\n";
        }

        // Añadir sección de slots libres
        mensaje += await enviarMensajeWhatsApp('informeDiario.slotsLibres', '', {}, true) + "\n";

        if (Object.keys(slotsAgrupados).length > 0) {
            // Ordenar por hora
            const horasOrdenadas = Object.keys(slotsAgrupados).sort();

            for (const hora of horasOrdenadas) {
                const cantidad = slotsAgrupados[hora];
                mensaje += await enviarMensajeWhatsApp('informeDiario.slotLinea', '', {
                    cantidad,
                    hora
                }, true) + "\n";
            }
        } else {
            mensaje += await enviarMensajeWhatsApp('informeDiario.sinSlots', '', {}, true) + "\n";
        }

        // Añadir sección de promoción
        mensaje += "\n" + await enviarMensajeWhatsApp('informeDiario.promocion', '', {}, true);

        // 8. Enviar mensaje al grupo de notificaciones
        const grupoId = WHATSAPP_GROUPS.notifications;
        if (grupoId) {
            await enviarMensajeWhatsApp(mensaje, grupoId);
            console.log('Informe diario enviado correctamente al grupo de notificaciones');
        } else {
            console.error('No se pudo enviar el informe diario: ID del grupo de notificaciones no configurado');
        }

    } catch (error) {
        console.error('Error al generar el informe diario:', error);
    }
};