import zod from 'zod'

const reservaSchema = z.object({
    "Fecha ISO": z.string().datetime({ message: 'Este campo debe contener una fecha válida' }),
    Inicio: z.string(),
    Fin: z.string(),
    Pista: z.string(),
    Nivel: z.enum([1, 2, 3], { message: 'El nivel solo puede estar entre el 1 y el 3' }),
    "Nº Actuales": z.integer({ message: 'Este campo debe ser un número entero' }),
    "Nº Faltantes": z.integer({ message: 'Este campo debe ser un número entero' }),
    Estado: z.enum(["Completa", "Abierta", "Cancelada"], { message: 'El estado de la partida solo puede ser "Abierta", "Completa" o "Cancelada"' }),
    "ID Event": z.string(),
    "1º Contacto": z.string({ required_error: 'Este campo es obligatorio' }),
    "Último Contacto": z.string(),
    "Actualización": z.string(),
    "Jugador 1": z.string(),
    "Jugador 2": z.string(),
    "Jugador 3": z.string(),
    "Jugador 4": z.string(),
    "Telefono 1": z.string(),
    "Telefono 2": z.string(),
    "Telefono 3": z.string(),
    "Telefono 4": z.string(),
    Lista_Invitados: z.string(),
    "Link Join": z.string(),
    "Link Delete": z.string(),
    "Link Cancel": z.string()
})

export function validateReserva(object) {
    return reservaSchema.safeParse(object)
}

export function validatePartialReserva(object) {
    return reservaSchema.partial().safeParse(object)
}