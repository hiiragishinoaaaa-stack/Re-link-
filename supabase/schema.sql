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

-- Allow public read/write for MVP (no auth)
-- Disable RLS so the anon key can read and write
alter table links disable row level security;

-- Fast slug lookups on every redirect
create index on links (slug);

-- Atomic click counter — avoids read-modify-write races under concurrent traffic.
-- Called from the redirect handler via supabase.rpc('increment_click_count', { link_id: '...' })
create or replace function increment_click_count(link_id uuid)
returns void
language sql
as $$
  update links set click_count = click_count + 1 where id = link_id;
$$;
