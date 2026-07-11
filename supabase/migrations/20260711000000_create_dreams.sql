-- DreamCatcher cloud dreams
-- Compatible with localStorage shape in src/main.js:
--   { id, title, body, createdAt }
-- Run in Supabase Dashboard → SQL Editor (or via supabase db push).
-- Does not connect the frontend yet.

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),

  constraint dreams_body_not_blank check (length(trim(body)) > 0)
);

-- Newest-first journal order (matches localStorage unshift behavior)
create index if not exists dreams_user_created_at_idx
  on public.dreams (user_id, created_at desc);

comment on table public.dreams is 'Per-user dream journal entries for DreamCatcher.';
comment on column public.dreams.id is 'Dream id (UUID). Maps to localStorage dream.id.';
comment on column public.dreams.user_id is 'Owner; must match auth.users.id / auth.uid().';
comment on column public.dreams.title is 'Optional title. Maps to localStorage dream.title.';
comment on column public.dreams.body is 'Dream text. Maps to localStorage dream.body (the “content”).';
comment on column public.dreams.created_at is 'When caught. Maps to localStorage dream.createdAt.';

alter table public.dreams enable row level security;

-- Read only your own dreams
create policy "dreams_select_own"
  on public.dreams
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Insert only as yourself
create policy "dreams_insert_own"
  on public.dreams
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Update only your own dreams
create policy "dreams_update_own"
  on public.dreams
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Delete only your own dreams
create policy "dreams_delete_own"
  on public.dreams
  for delete
  to authenticated
  using (auth.uid() = user_id);
