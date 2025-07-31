export default {
    reservas: {
        confirmacion: {
            exito: "✅ Votre réservation pour {{nombre}} a été confirmée !\n📅 Date : {{fecha}}\n🕒 Horaire : {{horaInicio}} - {{horaFin}}\n🎾 Terrain : {{pista}}\n\n📱 Vous pouvez annuler votre réservation ici : \n👉🏼 [Annuler la réservation]({{urlCancelar}})\n\n🔄 Nombre de joueurs manquants : {{jugadores_faltan}}\n📈 État du match : {{estado}}\n\n🚫 Si vous souhaitez supprimer un invité, cliquez ici : [Supprimer {{textoReserva}}]({{urlEliminar}}).",
            invitacion: "👉🏼 Si vous souhaitez inviter un joueur, envoyez ce message à la personne : [Rejoindre le match]({{urlInvitar}})"
        },
        unirse: {
            exito: "✅ *Vous avez rejoint le match avec succès !*\n\n📋 *Détails du match* :\n🆔 ID du match : {{idPartida}}\n📅 Date : {{fecha}}\n⏰ Horaire : {{horaInicio}} - {{horaFin}}\n🎾 Terrain : {{pista}}\n🏆 Niveau : {{nivel}}\n👑 Organisateur : {{organizador}}\n\n👥 *Joueurs* ({{jugadoresActuales}}/4)",
            jugadoresFaltan: "⚠️ Il manque encore {{cantidad}} joueur(s)",
            partidaCompleta: "✅ La partie est complète !"
        },
        cancelacion: {
            exito: "✅ Votre réservation a été annulée avec succès.\n\n📅 Détails de la réservation annulée :\n📆 Date : {{fecha}}\n🕒 Heure : {{hora}}\n🎾 Terrain : {{pista}}{{motivoTexto}}"
        },
        disponibilidad: {
            noDisponible: "😔 Désolé, il n'y a pas de disponibilité ni d'alternatives proches.",
            disponible: "✅ Le terrain {{pista}} est disponible le {{fecha}}.\n\n[Cliquez ici pour confirmer la réservation]({{enlace}})",
            alternativasMismoHorario: "😊 Il y a d'autres terrains disponibles à la même heure :\n{{listaHorarios}}",
            alternativas: "😔 Pas de disponibilité à l'heure sélectionnée. Options alternatives :\n{{listaHorarios}}",
            formatoHorario: "👉🏼 *Le {{fecha}} de {{horaInicio}} à {{horaFin}} sur {{pista}}* : [Cliquez pour réserver]({{enlace}})",
            pistaNoDisponible: "😔 Nous sommes désolés, ce court n'est plus disponible",
            verVisual: "👀 Vous préférez voir les horaires de manière visuelle ? Consultez toutes les options ici :\n{{enlace}}"
        },
        eliminarJugador: {
            exito: "⚠️ Mise à jour du match\n\nLe joueur {{nombreJugador}} a été retiré de votre match.\n\n📅 Date : {{fecha}}\n⏰ Heure : {{hora}}\n🎾 Terrain : {{pista}}\n\n👥 Joueurs actuels : {{jugadoresActuales}}/4\n👥 Joueurs manquants : {{jugadoresFaltan}}",
            notificacion: "ℹ️ Vous avez été retiré d'un match\n\n{{organizador}} vous a retiré du match suivant :\n\n📅 Date : {{fecha}}\n⏰ Heure : {{hora}}\n🎾 Terrain : {{pista}}\n\nSi vous pensez qu'il s'agit d'une erreur, veuillez contacter l'organisateur."
        },
        nuevoJugador: {
            notificacion: "✅ *Nouveau joueur dans votre match !*\n\n👤 *{{nombreJugador}}* a rejoint votre match avec les détails suivants :\n\n🆔 ID du match : {{idPartida}}\n📅 Date : {{fecha}}\n⏰ Horaire : {{horaInicio}} - {{horaFin}}\n🎾 Terrain : {{pista}}\n🏆 Niveau : {{nivel}}\n{{estadoJugadores}}",
            jugadoresFaltan: "⚠️ Il manque encore {{cantidad}} joueur(s)",
            partidaCompleta: "✅ La partie est complète !"
        },
        misReservas: {
            encabezado: "🎾 Bonjour *{{nombre}}* ! 🎾\nVoici vos prochains matchs :\n\n",
            partidasCompletas: "✅ *MATCHS COMPLETS :*\n",
            partidasAbiertas: "🔄 *MATCHS OUVERTS :*\n",
            sinPartidasCompletas: "📝 Aucun match complet programmé.\n\n",
            sinPartidasAbiertas: "📝 Aucun match ouvert disponible.\n\n",
            formatoPartida: "━━━━━━━━━━━━━━━\n🏸 ID : *{{idPartida}}*\n📅 Date : {{fechaLegible}}\n🔵 État : {{estado}}\n",
            formatoPartidaAbierta: "👥 Joueurs : {{jugadoresActuales}}\n⭐ Manquant : {{jugadoresFaltantes}}\n",
            opcionesDuenio: "✅ Rejoindre : {{linkJoin}}\n🚫 Supprimer : {{linkDelete}}\n❌ Annuler : {{linkCancel}}\n👑 _Vous êtes le joueur principal_\n",
            opcionCancelar: "❌ Annuler : {{linkCancel}}\n👑 _Vous êtes le joueur principal_\n",
            despedida: "🏆 Profitez bien de votre jeu ! 🎾"
        }
    },
    invitaciones: {
        nuevaInvitacion: "Bonjour *{{nombre}}*! \r\r" +
            "Nous vous invitons à rejoindre la partie (Niveau: *{{nivel}}*) " +
            "créée par *{{creador}}*." +
            "\rDate: *{{fecha}}* \r" +
            "\rHeure: *{{hora}}* \r\r" +
            "Pour confirmer votre participation, cliquez sur le lien suivant:\r" +
            "👉 {{enlace}} \r\r" +
            "Nous vous attendons!"
    },
    jugadores: {
        registro: {
            confirmacion: "Bonjour {{nombre}} ! Votre numéro a été enregistré dans Racket Planner.\n\n🔵 Veuillez confirmer votre inscription en cliquant sur le lien suivant :\n{{enlace}}\n\n⚠️ *IMPORTANT* : Si vous ne confirmez pas votre inscription dans les 7 prochains jours, vos données seront automatiquement supprimées du système.\n\nSi vous avez reçu ce message par erreur ou si vous souhaitez supprimer vos données, il vous suffit de me le demander et je les supprimerai immédiatement."
        },
        confirmacion: {
            exito: "Merci {{nombre}} ! Votre numéro a été correctement confirmé dans Racket Planner. Vous pouvez maintenant recevoir des invitations aux matchs selon vos préférences."
        },
        preferencias: {
            actualizadas: "Vos préférences ont été mises à jour avec succès.",
            error: "Désolé, une erreur s'est produite lors de la mise à jour de vos préférences.",
            errorSistema: "Désolé, une erreur s'est produite dans le système. Veuillez réessayer plus tard."
        },
        eliminacion: {
            exito: "Vos données ont été supprimées de notre système avec succès",
            error: "Une erreur s'est produite lors de la suppression de vos données du système, veuillez réessayer plus tard"
        }
    },
    fecha: {
        dias: {
            lunes: "Lundi",
            martes: "Mardi",
            miercoles: "Mercredi",
            jueves: "Jeudi",
            viernes: "Vendredi",
            sabado: "Samedi",
            domingo: "Dimanche"
        },
        meses: {
            enero: "Janvier",
            febrero: "Février",
            marzo: "Mars",
            abril: "Avril",
            mayo: "Mai",
            junio: "Juin",
            julio: "Juillet",
            agosto: "Août",
            septiembre: "Septembre",
            octubre: "Octobre",
            noviembre: "Novembre",
            diciembre: "Décembre"
        }
    },
    conectores: {
        de: "-"
    },
    estado_completa: "Complète",
    estado_abierta: "Ouverte",
    estado_otro: "En attente",
    fecha_separador: " à ",

    invitado_de: "Invité de"
};