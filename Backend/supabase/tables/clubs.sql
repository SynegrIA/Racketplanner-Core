create table public.clubs (
  id uuid not null default gen_random_uuid (),
  nombre text not null,
  email text not null,
  dominio text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  subscription_status text null default 'inactive'::text,
  subscription_plan text null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  subscription_start_date timestamp with time zone null,
  subscription_end_date timestamp with time zone null,
  logo_url text null,
  primary_color text null default '#22C55E'::text,
  secondary_color text null default '#16A34A'::text,
  accent_color text null default '#15803D'::text,
  background_color text null default '#FFFFFF'::text,
  text_color text null default '#1F2937'::text,
  constraint clubs_pkey primary key (id),
  constraint clubs_dominio_key unique (dominio),
  constraint clubs_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_clubs_stripe_customer_id on public.clubs using btree (stripe_customer_id) TABLESPACE pg_default;

create index IF not exists idx_clubs_stripe_subscription_id on public.clubs using btree (stripe_subscription_id) TABLESPACE pg_default;

create index IF not exists idx_clubs_subscription_plan on public.clubs using btree (subscription_plan) TABLESPACE pg_default;