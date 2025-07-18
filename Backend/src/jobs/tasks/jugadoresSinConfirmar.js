import { JugadoresModel } from '../../models/jugadores.js'

export const jugadoresSinConfirmar = async () => {
    try {
        console.log('Ejecutando tarea: verificación de jugadores sin confirmar');

        // Obtener todos los jugadores sin confirmar
        const jugadoresSinConfirmar = await JugadoresModel.getJugadoresSinConfirmar();
        console.log(`Se encontraron ${jugadoresSinConfirmar.length} jugadores sin confirmar`);

        if (jugadoresSinConfirmar.length === 0) {
            return;
        }

        // Calcular la fecha límite (una semana atrás)
        const unaSemanaMilisegundos = 7 * 24 * 60 * 60 * 1000;
        const fechaLimite = new Date(Date.now() - unaSemanaMilisegundos);

        // Filtrar jugadores creados hace más de una semana
        const jugadoresAEliminar = jugadoresSinConfirmar.filter(jugador => {
            const fechaCreacion = new Date(jugador.created_at);
            return fechaCreacion < fechaLimite;
        });

        console.log(`Hay ${jugadoresAEliminar.length} jugadores que llevan más de una semana sin confirmar`);

        // Eliminar cada jugador que cumple con el criterio
        let eliminados = 0;
        for (const jugador of jugadoresAEliminar) {
            const resultado = await JugadoresModel.delete(jugador.Teléfono);

            if (resultado.success) {
                eliminados++;
                console.log(`Eliminado jugador ${jugador.Nombre} con teléfono ${jugador.Teléfono}`);
            } else {
                console.error(`Error al eliminar jugador ${jugador.Teléfono}: ${resultado.error}`);
            }
        }

        console.log(`Proceso completado: ${eliminados} jugadores eliminados de ${jugadoresAEliminar.length} candidatos`);

        return {
            procesados: jugadoresSinConfirmar.length,
            candidatos: jugadoresAEliminar.length,
            eliminados: eliminados
        };
    } catch (error) {
        console.error('Error al procesar jugadores sin confirmar:', error);
        throw error;
    }
}