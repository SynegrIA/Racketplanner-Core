import { ClubsModel } from '../models/clubs.js';

// ID del club a utilizar - REEMPLAZAR CON EL ID DE TU CLUB
const CLUB_ID = "24f0c80b-fd53-47b6-89f1-0f197b792a4c";

// Configuración base de los calendarios con IDs de Google Calendar (no modificar estos IDs)
export const CALENDARS = [
    {
        id: "27ade49924d7fc44eb4e6ff76b294614600c7d783d68eb5db1a6b60340cec68c@group.calendar.google.com",
        index: 1,
        name: "Pista 1",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "09:00", end: "21:00" }
            ]
        },
        avaliable: true,
        slotDuration: 90
    },
    {
        id: "b1f9669a07324fdf0d93c733f4615302a53c13b75adc4aeb936f4353cf0aed31@group.calendar.google.com",
        index: 2,
        name: "Pista 2",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "09:00", end: "21:00" }
            ]
        },
        avaliable: true,
        slotDuration: 90
    },
    {
        id: "43ef9998cd2031d54a22fcbd1de64163efabfd480450c60f02849832c03f6bff@group.calendar.google.com",
        index: 3,
        name: "Pista 3",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "09:00", end: "21:00" }
            ]
        },
        avaliable: true,
        slotDuration: 90
    },
    {
        id: "484129fdd0fab2be87b5b2bc6088250e2d2b8c5f8e53a09c7deef18b174ef986@group.calendar.google.com",
        index: 4,
        name: "Pista 4",
        businessHours: {
            weekdays: [
                { start: "09:00", end: "14:00" },
                { start: "15:00", end: "22:00" }
            ],
            weekends: [
                { start: "09:00", end: "21:00" }
            ]
        },
        avaliable: true,
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
        { start: "15:00", end: "22:00" }
    ],
    weekends: [
        { start: "09:00", end: "14:00" },
        { start: "15:00", end: "22:00" }
    ],
};

/**
 * DURACIÓN DE RESERVAS
 * Tiempo en minutos que dura cada reserva
 */
export const RESERVATION_DURATION_MINUTES = 90;

// Función para cargar la configuración dinámica desde la BD
async function loadDynamicConfig() {
    try {
        console.log("Cargando configuración de calendarios desde base de datos...");
        const clubsModel = new ClubsModel();
        const config = await clubsModel.getCalendarConfigFromSettings(CLUB_ID);

        if (config && config.calendars && config.calendars.length > 0) {
            console.log(`Configuración cargada: ${config.calendars.length} pistas`);

            // Actualizamos cada calendario individualmente para mantener las referencias
            config.calendars.forEach((updatedCalendar, i) => {
                if (i < CALENDARS.length) {
                    // Actualizamos nombre
                    CALENDARS[i].name = updatedCalendar.name;

                    // Actualizamos horarios laborables
                    CALENDARS[i].businessHours.weekdays = [];
                    updatedCalendar.businessHours.weekdays.forEach(interval => {
                        CALENDARS[i].businessHours.weekdays.push({
                            start: interval.start,
                            end: interval.end
                        });
                    });

                    // Actualizamos horarios de fin de semana
                    CALENDARS[i].businessHours.weekends = [];
                    updatedCalendar.businessHours.weekends.forEach(interval => {
                        CALENDARS[i].businessHours.weekends.push({
                            start: interval.start,
                            end: interval.end
                        });
                    });

                    // Actualizamos disponibilidad
                    CALENDARS[i].avaliable = updatedCalendar.avaliable !== false;

                    console.log(`Actualizado ${CALENDARS[i].name}:`);
                    console.log(`- Días laborables: ${JSON.stringify(CALENDARS[i].businessHours.weekdays)}`);
                    console.log(`- Fin de semana: ${JSON.stringify(CALENDARS[i].businessHours.weekends)}`);
                }
            });

            // Actualizamos business hours haciendo copia profunda
            if (config.businessHours) {
                BUSINESS_HOURS.weekdays = [];
                config.businessHours.weekdays.forEach(interval => {
                    BUSINESS_HOURS.weekdays.push({
                        start: interval.start,
                        end: interval.end
                    });
                });

                BUSINESS_HOURS.weekends = [];
                config.businessHours.weekends.forEach(interval => {
                    BUSINESS_HOURS.weekends.push({
                        start: interval.start,
                        end: interval.end
                    });
                });
            }

            console.log('✅ Configuración de calendarios actualizada exitosamente');
        } else {
            console.warn('⚠️ No se pudo cargar la configuración de calendarios o está vacía');
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración dinámica:', error);
    }
}

// Cargar la configuración al inicio
loadDynamicConfig().catch(console.error);

// Función para recargar la configuración bajo demanda
export async function reloadCalendarConfig() {
    console.log('🔄 Recargando configuración de calendarios...');
    await loadDynamicConfig();

    // Devolver copia de la configuración para evitar problemas de referencia
    return {
        CALENDARS: CALENDARS.map(c => ({ ...c })),
        BUSINESS_HOURS: { ...BUSINESS_HOURS },
        RESERVATION_DURATION_MINUTES
    };
}


// export const CALENDARS = [
//     {
//         id: "27ade49924d7fc44eb4e6ff76b294614600c7d783d68eb5db1a6b60340cec68c@group.calendar.google.com",
//         name: "Pista 1",
//         index: 1,
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
//         id: "b1f9669a07324fdf0d93c733f4615302a53c13b75adc4aeb936f4353cf0aed31@group.calendar.google.com",
//         name: "Pista 2",
//         index: 2,
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
//         id: "43ef9998cd2031d54a22fcbd1de64163efabfd480450c60f02849832c03f6bff@group.calendar.google.com",
//         name: "Pista 3",
//         index: 3,
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
//         id: "484129fdd0fab2be87b5b2bc6088250e2d2b8c5f8e53a09c7deef18b174ef986@group.calendar.google.com",
//         name: "Pista 4",
//         index: 4,
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