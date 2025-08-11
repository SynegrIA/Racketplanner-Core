import { cronManager } from './cronoManager.js';
import { cierraPartidas } from './tasks/cierraPartidas.js';
import { jugadoresSinConfirmar } from './tasks/jugadoresSinConfirmar.js';
import { procesarCapturasPagos } from './tasks/pagos.js';

/**
 * Inicializa y registra todas las tareas programadas
 */
export const initializeJobs = () => {

    cronManager.register(
        'cierre-partidas',
        '0 * * * *', //Se ejecuta cada hora
        () => cierraPartidas()
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

    // cronManager.register(
    //     'jugadoresSinConfirmar',
    //     '0 * * * *',
    //     () => jugadoresSinConfirmar()
    // )

    // Inicia todas las tareas
    cronManager.startAll();
};

// Exportar para inicializar desde el punto de entrada de la aplicación
export default { initializeJobs };