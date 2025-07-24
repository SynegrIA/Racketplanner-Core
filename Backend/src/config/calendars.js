
// export const CALENDARS = [
//     {
//         id: "1fa5a01f6495b65db1a813613139b574e38f871fbb808966bed49eca638af3ef@group.calendar.google.com",
//         name: "Pista 1",
//         businessHours: {
//             weekdays: [
//                 { start: "09:00", end: "14:00" },
//                 { start: "15:00", end: "22:00" }
//             ],
//             weekends: [
//                 { start: "08:00", end: "23:00" }
//             ]
//         },
//         slotDuration: 90
//     },
//     {
//         id: "a363a6178792c9e888ea6c29c54a8086a1a266190f9a8a24dbc3931f22cd5452@group.calendar.google.com",
//         name: "Pista 2",
//         businessHours: {
//             weekdays: [
//                 { start: "09:00", end: "14:00" },
//                 { start: "15:00", end: "22:00" }
//             ],
//             weekends: [
//                 { start: "08:00", end: "23:00" }
//             ]
//         },
//         slotDuration: 90
//     },
//     {
//         id: "215731c0bf178e4b7f9f713f025a5ae28d3ce39cdd967581513df094c0446f01@group.calendar.google.com",
//         name: "Pista 3",
//         businessHours: {
//             weekdays: [
//                 { start: "09:00", end: "14:00" },
//                 { start: "15:00", end: "22:00" }
//             ],
//             weekends: [
//                 { start: "08:00", end: "23:00" }
//             ]
//         },
//         slotDuration: 90
//     },
//     {
//         id: "fc734f0b31e963a95f8db72dcd11d378faa1d07f992e3a8dca51ee1159924d03@group.calendar.google.com",
//         name: "Pista 4",
//         businessHours: {
//             weekdays: [
//                 { start: "09:00", end: "14:00" },
//                 { start: "15:00", end: "22:00" }
//             ],
//             weekends: [
//                 { start: "08:00", end: "23:00" }
//             ]
//         },
//         slotDuration: 90
//     },
// ];

// /**
//  * HORARIOS DEL NEGOCIO
//  * Configura aquí los horarios de apertura.
//  * weekdays: Horarios de lunes a viernes
//  * weekends: Horarios de fin de semana (vacío si está cerrado)
//  */
// export const BUSINESS_HOURS = {
//     weekdays: [
//         { start: "09:00", end: "14:00" },
//         { start: "15:00", end: "22:00" }  // Horario de mañana
//         //{ start: "16:00", end: "23:00" },   Horario de tarde
//     ],
//     weekends: [
//         { start: "09:00", end: "14:00" },
//         { start: "15:00", end: "22:00" }
//     ], // Array vacío significa cerrado
// };

// /**
//  * DURACIÓN DE RESERVAS
//  * Tiempo en minutos que dura cada reserva
//  */
// export const RESERVATION_DURATION_MINUTES = 90;


export const CALENDARS = [
    {
        id: "27ade49924d7fc44eb4e6ff76b294614600c7d783d68eb5db1a6b60340cec68c@group.calendar.google.com",
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
        id: "b1f9669a07324fdf0d93c733f4615302a53c13b75adc4aeb936f4353cf0aed31@group.calendar.google.com",
        name: "Pista 2",
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
        id: "43ef9998cd2031d54a22fcbd1de64163efabfd480450c60f02849832c03f6bff@group.calendar.google.com",
        name: "Pista 3",
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
        id: "484129fdd0fab2be87b5b2bc6088250e2d2b8c5f8e53a09c7deef18b174ef986@group.calendar.google.com",
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