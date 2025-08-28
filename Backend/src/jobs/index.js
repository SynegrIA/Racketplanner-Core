import { cronManager } from './cronoManager.js';
import { cierraPartidas } from './tasks/cierraPartidas.js';
import { jugadoresSinConfirmar } from './tasks/jugadoresSinConfirmar.js';
import { procesarCapturasPagos, recordarPagos, enforceAutorizacionInicial } from './tasks/pagos.js';
import { dailyUpdate } from './tasks/dailyUpdate.js';
import { PASARELA, DAILY_NOTIFICATION } from '../config/config.js';

/**
 * Inicializa y registra todas las tareas programadas
 */
export const initializeJobs = () => {

    cronManager.register(
        'cierre-partidas',
        '0 * * * *', //Se ejecuta cada hora
        () => cierraPartidas()
    );


    cronManager.register(
        'jugadoresSinConfirmar',
        '0 * * * *',
        () => jugadoresSinConfirmar()
    )

    // Tarea para el informe diario - se ejecuta todos los días a las 23:00 (11 PM)
    if (DAILY_NOTIFICATION) {
        cronManager.register(
            'informe-diario',
            '0 23 * * *',
            () => dailyUpdate()
        );
    }

    if (PASARELA === 'true') {

        let enforceInicialRunning = false;
        cronManager.register(
            'enforce-autorizacion-inicial',
            '*/2 * * * *',
            async () => {
                if (enforceInicialRunning) return;
                enforceInicialRunning = true;
                try {
                    await enforceAutorizacionInicial();
                } catch (e) {
                    console.error('[cron enforce-autorizacion-inicial] error:', e);
                } finally {
                    enforceInicialRunning = false;
                }
            }
        );

        let capturaPagosRunning = false;
        cronManager.register(
            'captura-pagos',
            '*/5 * * * *', // cada 5 min
            async () => {
                if (capturaPagosRunning) {
                    console.warn('[cron captura-pagos] ejecución anterior aún en curso, se omite este tick');
                    return;
                }
                capturaPagosRunning = true;
                try {
                    await procesarCapturasPagos();
                } catch (e) {
                    console.error('[cron captura-pagos] error:', e);
                } finally {
                    capturaPagosRunning = false;
                }
            }
        );

        let recordarPagosRunning = false;
        cronManager.register(
            'recordar-pagos',
            '*/30 * * * *',
            async () => {
                if (recordarPagosRunning) {
                    console.warn('[cron recordar-pagos] ejecución anterior en curso, se omite');
                    return;
                }
                recordarPagosRunning = true;
                try {
                    await recordarPagos();
                } catch (e) {
                    console.error('[cron recordar-pagos] error:', e);
                } finally {
                    recordarPagosRunning = false;
                }
            }
        );
    }

    // Inicia todas las tareas
    cronManager.startAll();
};

// Exportar para inicializar desde el punto de entrada de la aplicación
export default { initializeJobs };