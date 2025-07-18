import axios from 'axios';
import { ReservasModel } from '../../models/reservas.js';

export const cierraPartidas = async () => {
    const WEBHOOKURL = "https://n8n.synergiapro.es/webhook/picketball-planner-partida-abierta";

    console.log('🚀 INICIANDO PRUEBA DE CIERRE DE PARTIDAS - ' + new Date().toLocaleTimeString());

    try {
        console.log('🔍 Buscando reservas abiertas para procesar...');

        // Obtener todas las reservas abiertas
        const reservasAbiertas = await ReservasModel.getAllOpenReservas();
        console.log(`📊 Encontradas ${reservasAbiertas.length} reservas abiertas.`);

        // Log adicional para depuración
        if (reservasAbiertas.length > 0) {
            console.log('📋 Primeras reservas encontradas:',
                JSON.stringify(reservasAbiertas.slice(0, 3), null, 2));
        }

        // Contadores para seguimiento
        let exitosas = 0;
        let fallidas = 0;

        // Procesar cada reserva
        for (const reserva of reservasAbiertas) {
            try {
                const calendarId = reserva.calendarID;
                const eventId = reserva['ID Event'];

                if (!calendarId || !eventId) {
                    console.warn(`⚠️ Reserva no tiene calendarID o ID Event válidos`);
                    fallidas++;
                    continue;
                }

                console.log(`🔄 Enviando solicitud para calendarID: ${calendarId}, ID Event: ${eventId}`);

                // Enviar la solicitud al webhook
                await axios.post(WEBHOOKURL, {
                    calendarId,
                    eventId
                });

                console.log(`✅ Procesada reserva con ID Event: ${eventId}`);
                exitosas++;
            } catch (err) {
                console.error(`❌ Error al procesar reserva:`, err.message);
                fallidas++;
            }
        }

        console.log(`📈 Resumen: ${exitosas} exitosas, ${fallidas} fallidas de ${reservasAbiertas.length} reservas`);
        console.log('✅ FINALIZADA PRUEBA DE CIERRE DE PARTIDAS\n');

    } catch (error) {
        console.error('❌ Error al ejecutar cierre de partidas:', error);
        throw error;
    }
};