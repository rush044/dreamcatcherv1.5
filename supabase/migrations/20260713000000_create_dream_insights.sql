-- Dream Insights: one structured AI reflection per dream.
-- Run in Supabase Dashboard → SQL Editor (or via supabase db push).
-- Do not treat as applied until confirmed by the project owner.

create extension if not exists "pgcrypto";

create table if not exists public.dream_insights (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null references public.dreams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint dream_insights_dream_id_unique unique (dream_id),
  constraint dream_insights_content_is_object check (jsonb_typeof(content) = 'object')
);

create index if not exists dream_insights_user_id_idx
  on public.dream_insights (user_id);

create index if not exists dream_insights_dream_id_idx
  on public.dream_insights (dream_id);

comment on table public.dream_insights is
  'One AI Dream Insight per dream; owned by the same user as the dream.';
comment on column public.dream_insights.dream_id is
  'Dream this insight belongs to. Unique — one saved insight per dream.';
comment on column public.dream_insights.user_id is
  'Owner; must match auth.uid() and the dream owner.';
comment on column public.dream_insights.content is
  'Validated structured insight JSON returned by the server.';
comment on column public.dream_insights.created_at is
  'When the insight was first generated.';
comment on column public.dream_insights.updated_at is
  'When the insight row was last written.';

alter table public.dream_insights enable row level security;

create policy "dream_insights_select_own"
  on public.dream_insights
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "dream_insights_insert_own"
  on public.dream_insights
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.dreams d
      where d.id = dream_id
        and d.user_id = auth.uid()
    )
  );

create policy "dream_insights_update_own"
  on public.dream_insights
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.dreams d
      where d.id = dream_id
        and d.user_id = auth.uid()
    )
  );

create policy "dream_insights_delete_own"
  on public.dream_insights
  for delete
  to authenticated
  using (auth.uid() = user_id);
