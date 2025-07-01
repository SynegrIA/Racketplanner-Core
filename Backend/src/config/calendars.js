
export const CALENDARS = [
    {
        id: "1fa5a01f6495b65db1a813613139b574e38f871fbb808966bed49eca638af3ef@group.calendar.google.com",
        name: "Pista 1",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "08:00", end: "23:00" }
            ]
        },
        slotDuration: 90
    },
    {
        id: "a363a6178792c9e888ea6c29c54a8086a1a266190f9a8a24dbc3931f22cd5452@group.calendar.google.com",
        name: "Pista 2",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "08:30", end: "23:30" }
            ]
        },
        slotDuration: 90
    },
    {
        id: "215731c0bf178e4b7f9f713f025a5ae28d3ce39cdd967581513df094c0446f01@group.calendar.google.com",
        name: "Pista 3",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "09:00", end: "00:00" }
            ]
        },
        slotDuration: 90
    },
    {
        id: "fc734f0b31e963a95f8db72dcd11d378faa1d07f992e3a8dca51ee1159924d03@group.calendar.google.com",
        name: "Pista 4",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "08:00", end: "23:00" }
            ]
        },
        slotDuration: 90
    },
];

/**
 * HORARIOS DEL NEGOCIO
 * Configura aquí los horarios de apertura.
 * weekdays: Horarios de lunes a viernes
 * weekends: Horarios de fin de semana (vacío si está cerrado)
 */
export const BUSINESS_HOURS = {
    weekdays: [
        { start: "09:00", end: "14:00" },
        { start: "15:00", end: "22:00" }  // Horario de mañana
        //{ start: "16:00", end: "23:00" },   Horario de tarde
    ],
    weekends: [
        { start: "09:00", end: "14:00" },
        { start: "15:00", end: "22:00" }
    ], // Array vacío significa cerrado
};

/**
 * DURACIÓN DE RESERVAS
 * Tiempo en minutos que dura cada reserva
 */
export const RESERVATION_DURATION_MINUTES = 90;