-- Dream body/title length limits aligned with Dream Insights API caps.
-- Run in Supabase Dashboard → SQL Editor (or via supabase db push).
-- Repository evidence only until confirmed applied in production.

alter table public.dreams
  add constraint dreams_body_max_length check (length(body) <= 8000);

alter table public.dreams
  add constraint dreams_title_max_length check (length(title) <= 200);
