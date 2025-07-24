create table public."Jugadores" (
  "ID" serial not null,
  "Nombre Whatsapp" text null,
  "Nombre Real" text null,
  "Teléfono" text null,
  "Nivel" public.nivel_enum null,
  "Preferencias" public.preferencias_enum null,
  "Estado" text null default ''::text,
  "Notificaciones" boolean null,
  "Máximo de invitaciones semanales" integer null,
  "Horario Preferencia" horario_preferencia_enum[] null,
  "Número confirmado?" boolean null default false,
  created_at timestamp with time zone null default now(),
  "Nivel validado?" boolean null default false,
  constraint Jugadores_pkey primary key ("ID"),
  constraint Jugadores_Teléfono_key unique ("Teléfono")
) TABLESPACE pg_default;