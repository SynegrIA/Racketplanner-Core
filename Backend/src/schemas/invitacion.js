import { z } from 'zod'

const invitacionSchema = z.object({
    nivel: z.string({ required_error: 'El nivel de la partida es obligatorio' }),
    nombre: z.string({ required_error: 'El nombre del jugador es obligatorio' }),
    numero: z.string({ required_error: 'El número de teléfono es obligatorio' }),
    jugadorCrea: z.string({ required_error: 'El nombre del creador es obligatorio' }),
    partidaId: z.string({ required_error: 'El ID de la partida es obligatorio' }),
    eventId: z.string({ required_error: 'El ID del evento es obligatorio' }),
    calendarId: z.string({ required_error: 'El ID del calendario es obligatorio' }),
    fecha: z.string({ required_error: 'La fecha de la partida es obligatoria' }),
    pista: z.string().optional()
})

export function validateInvitacion(object) {
    return invitacionSchema.safeParse(object)
}