import zod from 'zod'

const jugadorSchema = z.object({
    "Nombre Whatsapp": z.string({ required_error: 'El nombre de whatsapp es obligatorio' }),
    "Nombre Real": z.string({ required_error: 'El nombre real del usuario es obligatorio' }),
    Teléfono: z.string({ required_error: 'El teléfono del usuario es obligatorio' }),
    Notificaciones: z.boolean({ message: 'Este campo debe ser un boolean' }),
    "Horario preferencia": z.enum(["mañana", "tarde", "noche"], { message: 'El horario de preferencia solo puede ser "mañana", "tarde" o "noche"' }),
    "Máximo de invitaciones semanales": z.integer({ message: 'Este campo debe ser un número entero' })
    // Preferencias: zod.enum(["Mismo nivel", "+-1 nivel"], { required_error: 'La preferencia es obligatoria' })
    // Estado: z.enum(["Validado", "Pendiente_Validacion"], { message: 'El estado solo puede ser "Validado" o "Pendiente_Validacion"' }),
})

export function validateJugador(object) {
    return jugadorSchema.safeParse(object)
}

export function validatePartialJugador(object) {
    return jugadorSchema.partial().safeParse(object)
}