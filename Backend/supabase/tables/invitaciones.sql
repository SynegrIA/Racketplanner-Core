
create table public."Invitaciones" (
  "ID_Invitacion" serial not null,
  "ID_Partida" integer null,
  "Nombre Jugador" text null,
  "Fecha Partida" date null,
  "Tiempo envio" timestamp without time zone null,
  "Tiempo respuesta" timestamp without time zone null,
  "Telefono Jugador" text null,
  constraint Invitaciones_pkey primary key ("ID_Invitacion"),
  constraint Invitaciones_ID_Partida_fkey foreign KEY ("ID_Partida") references "Reservas" ("ID Partida"),
  constraint "Invitaciones_Telefono Jugador_fkey" foreign KEY ("Telefono Jugador") references "Jugadores" ("Teléfono") on update CASCADE on delete CASCADE
) TABLESPACE pg_default;