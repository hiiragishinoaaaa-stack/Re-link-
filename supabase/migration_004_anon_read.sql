-- Migration 004: allow anonymous reads for public redirect lookups
-- Run in the Supabase SQL editor (Dashboard → SQL editor).
--
-- Migration 003 enabled RLS but added no anon SELECT policy.
-- Redirect routes (/[slug], /go/[slug]) need to read links without
-- a user session. Since destination URLs are publicly reachable by
-- definition, an anon read policy is safe.

-- Allow anyone to read links (needed for public redirects)
DROP POLICY IF EXISTS "links: anon read all" ON links;
CREATE POLICY "links: anon read all"
  ON links FOR SELECT TO anon
  USING (true);

-- Make increment_click_count run as the function owner (postgres)
-- so anon callers can increment the counter even with RLS enabled.
CREATE OR REPLACE FUNCTION increment_click_count(link_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE links SET click_count = click_count + 1 WHERE id = link_id;
$$;

-- Also add view_count column and increment_view_count if missing
ALTER TABLE links ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_view_count(link_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE links SET view_count = view_count + 1 WHERE id = link_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO authenticated;
