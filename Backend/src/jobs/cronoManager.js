import cron from 'node-cron';

class CronManager {

    constructor() {
        this.tasks = new Map();
    }

    register(name, schedule, task, options = {}) {
        // Validar que el formato cron sea correcto
        if (!cron.validate(schedule)) {
            throw new Error(`Expresión cron inválida: ${schedule}`);
        }

        // Registrar la tarea
        const job = cron.schedule(schedule, async () => {
            console.log(`⏰ Ejecutando tarea programada: ${name} - ${new Date().toISOString()}`);
            try {
                await task();
                console.log(`✅ Tarea ${name} completada con éxito`);
            } catch (error) {
                console.error(`❌ Error en tarea ${name}:`, error);
            }
        }, options);

        this.tasks.set(name, job);
        console.log(`📋 Tarea "${name}" registrada con programación: ${schedule}`);

        return job;
    }

    /**
     * Inicia todas las tareas registradas
     */
    startAll() {
        console.log('🚀 Iniciando todas las tareas programadas...');
        for (const [name, job] of this.tasks.entries()) {
            job.start();
            console.log(`▶️ Tarea "${name}" iniciada`);
        }
    }

    /**
     * Detiene todas las tareas programadas
     */
    stopAll() {
        console.log('🛑 Deteniendo todas las tareas programadas...');
        for (const [name, job] of this.tasks.entries()) {
            job.stop();
            console.log(`⏹️ Tarea "${name}" detenida`);
        }
    }
}

export const cronManager = new CronManager();