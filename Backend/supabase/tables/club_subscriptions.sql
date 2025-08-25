create table public.club_subscriptions (
  id uuid not null default gen_random_uuid (),
  club_id uuid null,
  plan_name text not null,
  stripe_subscription_id text null,
  stripe_customer_id text null,
  status text null default 'active'::text,
  current_period_start timestamp with time zone null,
  current_period_end timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint club_subscriptions_pkey primary key (id),
  constraint club_subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint club_subscriptions_club_id_fkey foreign KEY (club_id) references clubs (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_club_subscriptions_club_id on public.club_subscriptions using btree (club_id) TABLESPACE pg_default;

create index IF not exists idx_club_subscriptions_stripe_id on public.club_subscriptions using btree (stripe_subscription_id) TABLESPACE pg_default;