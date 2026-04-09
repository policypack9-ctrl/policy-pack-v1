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

