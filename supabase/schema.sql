-- Run this in your Supabase SQL editor

create table links (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        unique not null,
  destination_url text        not null,
  og_title        text,
  og_description  text,
  og_image        text,
  click_count     integer     not null default 0,
  created_at      timestamptz not null default now()
);

-- Disable Row Level Security (layer 2).
-- Note: this alone is NOT enough — table-level GRANTs (layer 1) are also required.
alter table links disable row level security;

-- Fast slug lookups on every redirect
create index on links (slug);

-- Grant table-level privileges to the anon and authenticated roles.
--
-- When a table is created via the SQL editor Supabase does NOT auto-grant these,
-- unlike tables created through the dashboard UI.
-- Every route handler uses NEXT_PUBLIC_SUPABASE_ANON_KEY (the anon role), so
-- all four operations are required:
--   SELECT  — GET /api/links (list), GET /[slug] (redirect lookup)
--   INSERT  — POST /api/links (create link)
--   UPDATE  — used internally by increment_click_count (language sql, no security definer)
--   DELETE  — DELETE /api/links/:id
grant select, insert, update, delete on table public.links to anon;
grant select, insert, update, delete on table public.links to authenticated;

-- Atomic click counter — avoids read-modify-write races under concurrent traffic.
-- Called from the redirect handler via supabase.rpc('increment_click_count', { link_id: '...' })
--
-- Uses LANGUAGE sql without SECURITY DEFINER, so it inherits the caller's privileges.
-- The GRANT EXECUTE below, combined with the UPDATE grant above, is what makes it work.
create or replace function increment_click_count(link_id uuid)
returns void
language sql
as $$
  update links set click_count = click_count + 1 where id = link_id;
$$;

grant execute on function public.increment_click_count(uuid) to anon;
grant execute on function public.increment_click_count(uuid) to authenticated;
