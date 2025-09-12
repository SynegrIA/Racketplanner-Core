import { ClubsModel } from '../models/clubs.js';
import { CLUB_ID } from './config.js';
import { CLUB } from './config.js';


export let CALENDARS = [];
export let BUSINESS_HOURS = {};
export let RESERVATION_DURATION_MINUTES = 90;

// PadelPointRabat
if (CLUB === 'padelpointrabat') {
    CALENDARS = [
        {
            id: "27ade49924d7fc44eb4e6ff76b294614600c7d783d68eb5db1a6b60340cec68c@group.calendar.google.com",
            index: 1,
            name: "Pista 1",
            businessHours: {
                weekdays: [
                    { start: "08:00", end: "15:30" },
                    { start: "15:30", end: "21:30" }
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
                    { start: "08:00", end: "15:30" },
                    { start: "15:30", end: "21:30" }
                ],
                weekends: [
                    { start: "08:00", end: "21:30" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        }
    ];

    /**
     * HORARIOS DEL NEGOCIO
     * Configura aquí los horarios de apertura.
     * weekdays: Horarios de lunes a viernes
     * weekends: Horarios de fin de semana (vacío si está cerrado)
     */
    BUSINESS_HOURS = {
        weekdays: [
            { start: "08:00", end: "15:30" },
            { start: "15:30", end: "21:30" }
        ],
        weekends: [
            { start: "08:00", end: "15:30" },
            { start: "15:30", end: "21:30" }
        ],
    };

    /**
     * DURACIÓN DE RESERVAS
     * Tiempo en minutos que dura cada reserva
     */
    RESERVATION_DURATION_MINUTES = 90;
}


//Pickleball
if (CLUB === 'pickleball') {
    CALENDARS = [
        {
            id: "1fa5a01f6495b65db1a813613139b574e38f871fbb808966bed49eca638af3ef@group.calendar.google.com",
            name: "Pista 1",
            index: 1,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "a363a6178792c9e888ea6c29c54a8086a1a266190f9a8a24dbc3931f22cd5452@group.calendar.google.com",
            name: "Pista 2",
            index: 2,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "215731c0bf178e4b7f9f713f025a5ae28d3ce39cdd967581513df094c0446f01@group.calendar.google.com",
            name: "Pista 3",
            index: 3,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "fc734f0b31e963a95f8db72dcd11d378faa1d07f992e3a8dca51ee1159924d03@group.calendar.google.com",
            name: "Pista 4",
            index: 4,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
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
    BUSINESS_HOURS = {
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
    RESERVATION_DURATION_MINUTES = 90;
}


// HergonPadel

if (CLUB === 'hergonpadel') {
    CALENDARS = [
        {
            id: "c32e9cb6c517ebfb3e313e6b45308cd7d8b6e7466c3f813e84a4433137222b84@group.calendar.google.com",
            name: "Pista 1",
            index: 1,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "dc5bbfbd34d6a6d326fb7ddfa9e849c84b531ea41776573ec5e0f9eeb521b1d1@group.calendar.google.com",
            name: "Pista 2",
            index: 2,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "bf92651dedcf8951580aca58f2d4bca0eb657445b3106532656cf45d787727e7@group.calendar.google.com",
            name: "Pista 3",
            index: 3,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "cd79d2d4b775a14c818325525ee4af087cc7b805842dfa252bad6d47ca23a0e3@group.calendar.google.com",
            name: "Pista 4",
            index: 4,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
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
    BUSINESS_HOURS = {
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
    RESERVATION_DURATION_MINUTES = 90;
}

// DEMO
if (CLUB === 'demo') {
    CALENDARS = [
        {
            id: "c512d388fd6ec40e9e949985232b70319be34839a2d4d1a579fc8399874052c3@group.calendar.google.com",
            name: "Pista 1",
            index: 1,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "40fc0e7450df7ee2ca93ba928250e3e40144d4c433fc5aeb5d22657370b46b6d@group.calendar.google.com",
            name: "Pista 2",
            index: 2,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "7dcfb191210de83fe365fe6098cc5a1a01793ffe1bd04deffe81b0ca9750bb41@group.calendar.google.com",
            name: "Pista 3",
            index: 3,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
                ]
            },
            avaliable: true,
            slotDuration: 90
        },
        {
            id: "f2ce2d17d1e5ebb7ae0da6b3d30a50c3aac7ec4d55a69333fb2f98272425514e@group.calendar.google.com",
            name: "Pista 4",
            index: 4,
            businessHours: {
                weekdays: [
                    { start: "09:00", end: "14:00" },
                    { start: "15:00", end: "22:00" }
                ],
                weekends: [
                    { start: "08:00", end: "23:00" }
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
    BUSINESS_HOURS = {
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
    RESERVATION_DURATION_MINUTES = 90;
}




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

                    // Actualizamos duración del slot
                    CALENDARS[i].slotDuration = updatedCalendar.slotDuration || 90;

                    console.log(`Actualizado ${CALENDARS[i].name}:`);
                    console.log(`- Días laborables: ${JSON.stringify(CALENDARS[i].businessHours.weekdays)}`);
                    console.log(`- Fin de semana: ${JSON.stringify(CALENDARS[i].businessHours.weekends)}`);
                    console.log(`- Duración del slot: ${CALENDARS[i].slotDuration} minutos`);
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

            // Actualizamos la duración de reserva global si está definida
            if (config.reservationDuration) {
                RESERVATION_DURATION_MINUTES = config.reservationDuration;
                console.log(`- Duración de reserva global: ${RESERVATION_DURATION_MINUTES} minutos`);
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