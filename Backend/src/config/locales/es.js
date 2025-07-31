export default {
    reservas: {
        confirmacion: {
            exito: "✅ ¡Tu reserva para {{nombre}} ha sido confirmada!\n📅 Fecha: {{fecha}}\n🕒 Hora: {{horaInicio}} - {{horaFin}}\n🎾 Pista: {{pista}}\n\n📱 Puedes cancelar tu reserva aquí: \n👉🏼 [Cancelar Reserva]({{urlCancelar}})\n\n🔄 Número de jugadores que faltan: {{jugadores_faltan}}\n📈 Estado de la partida: {{estado}}\n\n🚫 Si deseas eliminar a algún invitado, pulsa aquí: [Eliminar {{textoReserva}}]({{urlEliminar}}).",
            invitacion: "👉🏼 Si deseas invitar a un jugador, envía este mensaje a la persona: [Unirse a Partida]({{urlInvitar}})",
            grupo: {
                invitacion: "🎾 ¡Nueva partida abierta de nivel {{nivel}}!\n\n🗓️ Fecha: {{fecha}}\n⏰ Hora: {{horaInicio}} - {{horaFin}}\n🏟️ Pista: {{pista}}\n👤 Organizador: {{organizador}}\n\n¿Quieres unirte? Haz clic aquí: {{urlInvitar}}"
            }
        },
        unirse: {
            exito: "✅ *¡Te has unido a la partida exitosamente!*\n\n📋 *Detalles de la partida*:\n🆔 ID Partida: {{idPartida}}\n📅 Fecha: {{fecha}}\n⏰ Horario: {{horaInicio}} - {{horaFin}}\n🎾 Pista: {{pista}}\n🏆 Nivel: {{nivel}}\n👑 Organizador: {{organizador}}\n\n👥 *Jugadores* ({{jugadoresActuales}}/4)",
            jugadoresFaltan: "⚠️ Aún faltan {{cantidad}} jugador(es)",
            partidaCompleta: "✅ ¡La partida está completa!"
        },
        cancelacion: {
            exito: "✅ Tu reserva ha sido cancelada con éxito.\n\n📅 Detalles de la reserva cancelada:\n📆 Fecha: {{fecha}}\n🕒 Hora: {{hora}}\n🎾 Pista: {{pista}}{{motivoTexto}}"
        },
        disponibilidad: {
            noDisponible: "😔 Lo sentimos, no hay disponibilidad ni alternativas cercanas.",
            disponible: "✅ Hay disponibilidad para reservar el {{pista}} el {{fecha}}.\n\n[Haz clic aquí para confirmar la reserva]({{enlace}})",
            alternativasMismoHorario: "😊 Hay otras pistas disponibles en la misma hora:\n{{listaHorarios}}",
            alternativas: "😔 No hay disponibilidad en la hora seleccionada. Opciones alternativas:\n{{listaHorarios}}",
            formatoHorario: "👉🏼 *El {{fecha}} de {{horaInicio}} a {{horaFin}} en {{pista}}*: [Haz clic para reservar]({{enlace}})",
            pistaNoDisponible: "😔 Lo sentimos, esta pista ya no está disponible",
            verVisual: "👀 ¿Prefieres ver los horarios de manera visual? Consulta todas las opciones aquí:\n{{enlace}}"
        },
        eliminarJugador: {
            exito: "⚠️ Actualización de partida\n\nEl jugador {{nombreJugador}} ha sido eliminado de tu partida.\n\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora}}\n🎾 Pista: {{pista}}\n\n👥 Jugadores actuales: {{jugadoresActuales}}/4\n👥 Jugadores faltantes: {{jugadoresFaltan}}",
            notificacion: "ℹ️ Has sido eliminado de una partida\n\n{{organizador}} te ha eliminado de la siguiente partida:\n\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora}}\n🎾 Pista: {{pista}}\n\nSi crees que es un error, por favor contacta con el organizador."
        },
        nuevoJugador: {
            notificacion: "✅ *¡Nuevo jugador en tu partida!*\n\n👤 *{{nombreJugador}}* se ha unido a tu partida con los siguientes detalles:\n\n🆔 ID Partida: {{idPartida}}\n📅 Fecha: {{fecha}}\n⏰ Horario: {{horaInicio}} - {{horaFin}}\n🎾 Pista: {{pista}}\n🏆 Nivel: {{nivel}}\n{{estadoJugadores}}",
            jugadoresFaltan: "⚠️ Aún faltan {{cantidad}} jugador(es)",
            partidaCompleta: "✅ ¡La partida está completa!"
        },
        misReservas: {
            encabezado: "🎾 ¡Hola *{{nombre}}*! 🎾\nEstas son tus próximas partidas:\n\n",
            partidasCompletas: "✅ *PARTIDAS COMPLETAS:*\n",
            partidasAbiertas: "🔄 *PARTIDAS ABIERTAS:*\n",
            sinPartidasCompletas: "📝 No hay partidas completas programadas.\n\n",
            sinPartidasAbiertas: "📝 No hay partidas abiertas disponibles.\n\n",
            formatoPartida: "━━━━━━━━━━━━━━━\n🏸 ID: *{{idPartida}}*\n📅 Fecha: {{fechaLegible}}\n🔵 Estado: {{estado}}\n",
            formatoPartidaAbierta: "👥 Jugadores: {{jugadoresActuales}}\n⭐ Faltan: {{jugadoresFaltantes}}\n",
            opcionesDuenio: "✅ Unirse: {{linkJoin}}\n🚫 Eliminar: {{linkDelete}}\n❌ Cancelar: {{linkCancel}}\n👑 _Eres el jugador principal_\n",
            opcionCancelar: "❌ Cancelar: {{linkCancel}}\n👑 _Eres el jugador principal_\n",
            despedida: "🏆 ¡Que disfrutes del juego! 🎾"
        }
    },
    invitaciones: {
        nuevaInvitacion: "¡Hola *{{nombre}}*! \r\r" +
            "Te invitamos a unirte a la partida (Nivel: *{{nivel}}*) " +
            "que ha creado *{{creador}}*." +
            "\rFecha: *{{fecha}}* \r" +
            "\rHora: *{{hora}}* \r\r" +
            "Para confirmar tu participación, haz clic en el siguiente enlace:\r" +
            "👉 {{enlace}} \r\r" +
            "¡Te esperamos!"
    },
    jugadores: {
        registro: {
            confirmacion: "¡Hola {{nombre}}! Tu número se ha registrado en Racket Planner.\n\n🔵 Por favor, confirma tu registro haciendo clic en el siguiente enlace:\n{{enlace}}\n\n⚠️ *IMPORTANTE*: Si no confirmas tu registro en los próximos 7 días, tus datos serán eliminados automáticamente del sistema.\n\nSi has recibido este mensaje por error o deseas eliminar tus datos, solo debes darme la orden y los eliminaré en un momento."
        },
        confirmacion: {
            exito: "¡Gracias {{nombre}}! Tu número ha sido confirmado correctamente en Racket Planner. Ya puedes recibir invitaciones a partidas según tus preferencias."
        },
        preferencias: {
            actualizadas: "Tus preferencias han sido actualizadas correctamente.",
            error: "Lo sentimos, ha ocurrido un error al intentar actualizar tus preferencias.",
            errorSistema: "Lo sentimos, ha ocurrido un error en el sistema. Por favor, inténtalo de nuevo más tarde."
        },
        eliminacion: {
            exito: "Tus datos han sido eliminados de nuestro sistema correctamente",
            error: "Ha habido un error eliminando tus datos del sistema, vuelva a intentarlo más tarde"
        }
    },
    fecha: {
        dias: {
            lunes: "Lunes",
            martes: "Martes",
            miercoles: "Miércoles",
            jueves: "Jueves",
            viernes: "Viernes",
            sabado: "Sábado",
            domingo: "Domingo"
        },
        meses: {
            enero: "Enero",
            febrero: "Febrero",
            marzo: "Marzo",
            abril: "Abril",
            mayo: "Mayo",
            junio: "Junio",
            julio: "Julio",
            agosto: "Agosto",
            septiembre: "Septiembre",
            octubre: "Octubre",
            noviembre: "Noviembre",
            diciembre: "Diciembre"
        }
    },
    conectores: {
        de: "de"
    },
    estado_completa: "Completa",
    estado_abierta: "Abierta",
    estado_otro: "Pendiente",
    fecha_separador: " a las ",

    invitado_de: "Invitado de"
};