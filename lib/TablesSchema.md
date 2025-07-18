-- Users table
create table public.users (
  id uuid not null default gen_random_uuid (),
  email text not null,
  full_name text null,
  created_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

-- Folders table
create table public.folders (
  id uuid not null default gen_random_uuid (),
  name text not null,
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint folders_pkey primary key (id),
  constraint folders_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

-- Tags table
create table public.tags (
  id uuid not null default gen_random_uuid (),
  name text not null,
  user_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint tags_pkey primary key (id),
  constraint tags_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) tablespace pg_default;

-- Notes table
create table public.notes (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  title text not null,
  content text not null,
  folder text null,
  tags text[] null,
  is_pinned boolean null default false,
  is_private boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint notes_pkey primary key (id),
  constraint notes_user_id_fkey foreign key (user_id) references auth.users (id)
) tablespace pg_default;

create index if not exists idx_notes_user_id on public.notes using btree (user_id) tablespace pg_default;

create extension if not exists "uuid-ossp"; // in case of the error  - extensions.uuid_generate_v4().