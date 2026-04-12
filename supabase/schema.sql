create extension if not exists pgcrypto;

create schema if not exists next_auth;

create table if not exists next_auth.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text
);

create table if not exists next_auth.accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references next_auth.users (id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  unique (provider, "providerAccountId")
);

create table if not exists next_auth.sessions (
  id uuid primary key default gen_random_uuid(),
  "sessionToken" text not null unique,
  "userId" uuid not null references next_auth.users (id) on delete cascade,
  expires timestamptz not null
);

create table if not exists next_auth.verification_tokens (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  unique (identifier, token)
);

create table if not exists public.user_profiles (
  user_id uuid primary key references next_auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  password_hash text,
  plan_id text default 'free',
  is_premium boolean not null default false,
  premium_unlocked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references next_auth.users (id) on delete cascade,
  document_key text not null,
  title text not null,
  markdown text not null,
  provider text,
  model text,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, document_key)
);

create index if not exists generated_documents_user_idx
  on public.generated_documents (user_id);

-- Enable Row Level Security (RLS) to prevent unauthorized access via anon_key
alter table public.user_profiles enable row level security;
alter table public.generated_documents enable row level security;

-- Since the application uses NextAuth and the Supabase Service Role Key on the server side,
-- we don't need to define complex policies for the anon_key. 
-- The Service Role Key will automatically bypass RLS.
-- We can add a deny-all policy for the anon_key to be explicit (which is the default when RLS is enabled without policies).



-- App settings table for feature flags (e.g. promo_active)
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by text
);

-- Seed default promo setting
insert into public.app_settings (key, value, updated_by)
values ('promo_active', 'true', 'system')
on conflict (key) do nothing;

-- Promo archive log
create table if not exists public.promo_archive_log (
  id uuid primary key default gen_random_uuid(),
  ended_at timestamptz not null default timezone('utc', now()),
  ended_by text not null,
  affected_users integer not null default 0,
  notified_users integer not null default 0,
  report jsonb,
  rolled_back_at timestamptz,
  rolled_back_by text
);