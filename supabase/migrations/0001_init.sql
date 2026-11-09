-- BAGCHASERKASH Beat Store: initial database schema
-- Run once in Supabase: SQL Editor → New query → paste → Run.
--
-- Security model: Row Level Security is ON for every table with NO public
-- policies, so the public/publishable key can't read or write anything.
-- All data access goes through the store's server using the secret key,
-- which is how hidden exclusive prices stay hidden.

-- ===== Admins =====
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ===== Store settings =====
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ===== Catalog =====
create table public.beats (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  bpm integer check (bpm between 40 and 300),
  musical_key text,
  genre text,
  mood text,
  duration_seconds integer check (duration_seconds > 0),
  produced_on date,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'unavailable', 'exclusive_sold')),
  sales_mode text not null default 'public'
    check (sales_mode in ('public', 'verified', 'approval')),
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index beats_status_idx on public.beats (status, publish_at);

create table public.beat_files (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references public.beats (id) on delete cascade,
  kind text not null
    check (kind in ('preview_mp3', 'waveform_json', 'artwork', 'master_mp3', 'master_wav', 'trackout_zip')),
  bucket text not null,
  object_key text not null,
  size_bytes bigint,
  checksum text,
  created_at timestamptz not null default now(),
  unique (beat_id, kind)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.beat_tags (
  beat_id uuid not null references public.beats (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (beat_id, tag_id)
);

-- ===== Licensing =====
create table public.license_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  default_price_cents integer not null check (default_price_cents >= 0),
  price_visible boolean not null default true,
  floor_price_cents integer check (floor_price_cents >= 0),
  delivers text[] not null default '{}',
  is_exclusive boolean not null default false,
  default_sales_mode text not null default 'public'
    check (default_sales_mode in ('public', 'verified', 'approval')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.license_template_versions (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.license_tiers (id) on delete restrict,
  version integer not null,
  terms jsonb not null default '{}',
  agreement_body text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tier_id, version)
);

-- Published agreement versions can never be edited or deleted.
create or replace function public.protect_published_templates()
returns trigger language plpgsql as $$
begin
  if old.published_at is not null then
    raise exception 'Published license versions are permanent. Create a new version instead.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
create trigger license_template_versions_immutable
  before update or delete on public.license_template_versions
  for each row execute function public.protect_published_templates();

create table public.beat_licenses (
  beat_id uuid not null references public.beats (id) on delete cascade,
  tier_id uuid not null references public.license_tiers (id) on delete restrict,
  price_cents_override integer check (price_cents_override >= 0),
  price_visible_override boolean,
  sales_mode_override text check (sales_mode_override in ('public', 'verified', 'approval')),
  available boolean not null default true,
  primary key (beat_id, tier_id)
);

-- ===== Customers & approvals =====
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  artist_name text,
  auth_user_id uuid references auth.users (id) on delete set null,
  verification_status text not null default 'none'
    check (verification_status in ('none', 'pending', 'verified', 'declined')),
  blocked boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create unique index customers_email_unique on public.customers (lower(email));

create table public.artist_applications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  social_url text,
  music_url text,
  intended_use text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete cascade,
  tier_id uuid not null references public.license_tiers (id),
  offered_price_cents integer check (offered_price_cents >= 0),
  counter_price_cents integer check (counter_price_cents >= 0),
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'countered', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index purchase_requests_status_idx on public.purchase_requests (status, created_at);

create table public.purchase_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  request_id uuid references public.purchase_requests (id) on delete set null,
  email text not null,
  beat_id uuid not null references public.beats (id) on delete cascade,
  tier_id uuid not null references public.license_tiers (id),
  price_cents integer not null check (price_cents >= 0),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== Orders =====
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('BCK-' || nextval('public.order_number_seq')::text),
  customer_id uuid references public.customers (id) on delete set null,
  email text not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  payment_method_type text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'partially_refunded', 'disputed', 'canceled')),
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'usd',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_status_idx on public.orders (status, created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  beat_id uuid not null references public.beats (id) on delete restrict,
  tier_id uuid not null references public.license_tiers (id) on delete restrict,
  price_cents integer not null,
  template_version_id uuid references public.license_template_versions (id) on delete restrict,
  terms_snapshot jsonb not null default '{}',
  agreement_snapshot text,
  agreement_pdf_key text,
  licensee_name text,
  created_at timestamptz not null default now()
);

-- One active exclusive per beat, enforced by the database itself.
create table public.exclusive_reservations (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references public.beats (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  status text not null default 'reserved' check (status in ('reserved', 'paid', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create unique index exclusive_one_active_per_beat
  on public.exclusive_reservations (beat_id)
  where status in ('reserved', 'paid');

-- ===== Delivery =====
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  file_kind text not null check (file_kind in ('master_mp3', 'master_wav', 'trackout_zip')),
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.download_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  entitlement_id uuid not null references public.entitlements (id) on delete cascade,
  expires_at timestamptz not null,
  max_uses integer not null default 5,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.download_events (
  id bigserial primary key,
  entitlement_id uuid references public.entitlements (id) on delete set null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ===== Deals =====
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  kind text not null default 'code' check (kind in ('code', 'sale', 'bulk')),
  stripe_promotion_code_id text,
  rules jsonb not null default '{}',
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===== Logs =====
create table public.stripe_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.event_log (
  id bigserial primary key,
  type text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigserial primary key,
  user_id uuid,
  action text not null,
  target text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ===== updated_at helper =====
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger beats_touch before update on public.beats
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ===== Lock everything down =====
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- ===== Starting data =====
insert into public.license_tiers
  (slug, name, sort_order, default_price_cents, price_visible, floor_price_cents, delivers, is_exclusive, default_sales_mode)
values
  ('mp3',       'MP3 Lease',        1,  5000, true,  null,   '{master_mp3}',                 false, 'public'),
  ('wav',       'WAV Lease',        2, 10000, true,  null,   '{master_wav}',                 false, 'public'),
  ('trackout',  'Trackout Lease',   3, 25000, true,  null,   '{master_wav,trackout_zip}',    false, 'public'),
  ('unlimited', 'Unlimited License',4, 40000, true,  null,   '{master_wav,trackout_zip}',    false, 'public'),
  ('exclusive', 'Exclusive License',5,     0, false, 100000, '{master_wav,trackout_zip}',    true,  'approval');

insert into public.settings (key, value) values
  ('payment_methods', '["card", "crypto"]'),
  ('download_link_hours', '72'),
  ('download_max_uses', '5');
