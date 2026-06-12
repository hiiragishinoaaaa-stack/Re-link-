-- Run this in your Supabase SQL editor

create table links (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  destination_url text not null,
  og_title    text,
  og_description text,
  og_image    text,
  click_count integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Allow public read/write for MVP (no auth)
-- Disable RLS so the anon key can read and write
alter table links disable row level security;

-- Optional: index for fast slug lookups
create index on links (slug);
