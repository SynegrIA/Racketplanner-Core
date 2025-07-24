
CREATE TYPE public.invitaciones_estado_enum AS ENUM ('Enviado', 'Confirmado', 'Eliminado', 'No contesta');

CREATE TYPE public.preferencias_enum AS ENUM ('Mismo nivel', '+-1 nivel');

CREATE TYPE public.horario_preferencia_enum AS ENUM ('mañana', 'tarde', 'noche');

CREATE TYPE public.nivel_enum AS ENUM ('1', '2', '3');

CREATE TYPE public.estado_enum AS ENUM ('Completa', 'Abierta', 'Cancelada');

CREATE TYPE public.stripe_subscription_status AS ENUM (
  'not_started',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

CREATE TYPE public.stripe_order_status AS ENUM ('pending', 'completed', 'canceled');