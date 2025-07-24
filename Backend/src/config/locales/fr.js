export default {
    reservas: {
        confirmacion: {
            exito: "✅ Votre réservation pour {{nombre}} a été confirmée !\n📅 Date : {{fecha}}\n🕒 Horaire : {{horaInicio}} - {{horaFin}}\n🎾 Terrain : {{pista}}\n\n📱 Vous pouvez annuler votre réservation ici : \n👉🏼 [Annuler la réservation]({{urlCancelar}})\n\n🔄 Nombre de joueurs manquants : {{jugadores_faltan}}\n📈 État du match : {{estado}}\n\n🚫 Si vous souhaitez supprimer un invité, cliquez ici : [Supprimer {{textoReserva}}]({{urlEliminar}}).",
            invitacion: "👉🏼 Si vous souhaitez inviter un joueur, envoyez ce message à la personne : [Rejoindre le match]({{urlInvitar}})"
        },
        unirse: {
            exito: "✅ *Vous avez rejoint le match avec succès !*\n\n📋 *Détails du match* :\n🆔 ID du match : {{idPartida}}\n📅 Date : {{fecha}}\n⏰ Horaire : {{horaInicio}} - {{horaFin}}\n🎾 Terrain : {{pista}}\n🏆 Niveau : {{nivel}}\n👑 Organisateur : {{organizador}}\n\n👥 *Joueurs* ({{jugadoresActuales}}/4) :\n1. {{jugador1}}{{jugador2}}{{jugador3}}{{jugador4}}\n{{estadoJugadores}}\n🚫 Si vous devez annuler votre participation : [Me retirer de ce match]({{urlEliminar}})"
        },
        cancelacion: {
            exito: "✅ Votre réservation a été annulée avec succès.\n\n📅 Détails de la réservation annulée :\n📆 Date : {{fecha}}\n🕒 Heure : {{hora}}\n🎾 Terrain : {{pista}}{{motivoTexto}}"
        },
        disponibilidad: {
            noDisponible: "😔 Désolé, il n'y a pas de disponibilité ni d'alternatives proches.",
            disponible: "✅ Le terrain {{pista}} est disponible le {{fecha}}.\n\n[Cliquez ici pour confirmer la réservation]({{enlace}})",
            alternativasMismoHorario: "😊 Il y a d'autres terrains disponibles à la même heure :\n{{listaHorarios}}",
            alternativas: "😔 Pas de disponibilité à l'heure sélectionnée. Options alternatives :\n{{listaHorarios}}",
            formatoHorario: "👉🏼 *Le {{fecha}} de {{horaInicio}} à {{horaFin}} sur {{pista}}* : [Cliquez pour réserver]({{enlace}})"
        },
        eliminarJugador: {
            exito: "⚠️ Mise à jour du match\n\nLe joueur {{nombreJugador}} a été retiré de votre match.\n\n📅 Date : {{fecha}}\n⏰ Heure : {{hora}}\n🎾 Terrain : {{pista}}\n\n👥 Joueurs actuels : {{jugadoresActuales}}/4\n👥 Joueurs manquants : {{jugadoresFaltan}}",
            notificacion: "ℹ️ Vous avez été retiré d'un match\n\n{{organizador}} vous a retiré du match suivant :\n\n📅 Date : {{fecha}}\n⏰ Heure : {{hora}}\n🎾 Terrain : {{pista}}\n\nSi vous pensez qu'il s'agit d'une erreur, veuillez contacter l'organisateur."
        },
        nuevoJugador: {
            notificacion: "✅ *Nouveau joueur dans votre match !*\n\n👤 *{{nombreJugador}}* a rejoint votre match avec les détails suivants :\n\n🆔 ID du match : {{idPartida}}\n📅 Date : {{fecha}}\n⏰ Horaire : {{horaInicio}} - {{horaFin}}\n🎾 Terrain : {{pista}}\n🏆 Niveau : {{nivel}}\n{{estadoJugadores}}"
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
    }
};