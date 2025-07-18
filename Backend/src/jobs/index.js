import { cronManager } from './cronoManager.js';
import { cierraPartidas } from './tasks/cierraPartidas.js';

/**
 * Inicializa y registra todas las tareas programadas
 */
export const initializeJobs = () => {

    cronManager.register(
        'cierre-partidas',
        '0 * * * *', //Se ejecuta cada hora
        () => cierraPartidas()
    );

    // Inicia todas las tareas
    cronManager.startAll();
};

// Exportar para inicializar desde el punto de entrada de la aplicación
export default { initializeJobs };