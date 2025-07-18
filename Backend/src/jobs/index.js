import { cronManager } from './cronoManager.js';
import { cierraPartidas } from './tasks/cierraPartidas.js';
import { jugadoresSinConfirmar } from './tasks/jugadoresSinConfirmar.js';

/**
 * Inicializa y registra todas las tareas programadas
 */
export const initializeJobs = () => {

    cronManager.register(
        'cierre-partidas',
        '0 * * * *', //Se ejecuta cada hora
        () => cierraPartidas()
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