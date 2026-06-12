-- ============================================================
-- Migration 003: Auth — user ownership + RLS
-- Run in the Supabase SQL editor (Dashboard → SQL editor).
-- ============================================================

-- 1. Add user_id column (nullable so existing links are unaffected)
ALTER TABLE links
  ADD COLUMN IF NOT EXISTS user_id UUID
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Optional index for faster per-user queries
CREATE INDEX IF NOT EXISTS links_user_id_idx ON links (user_id);

-- ============================================================
-- 2. Enable Row Level Security
-- ============================================================
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Policies
--
-- Public redirects (/[slug], /go/[slug]) use the SERVICE ROLE key
-- (getSupabaseAdmin) which bypasses RLS entirely — no policy needed
-- for anonymous reads.
--
-- The API routes use:
--   - createSupabaseServerClient()  (user's JWT via cookie) for
--     authenticated operations — RLS enforces ownership.
--   - getSupabaseAdmin()            (service role) for admin
--     operations and public redirect lookups.
-- ============================================================

-- Authenticated users can read their own links.
CREATE POLICY IF NOT EXISTS "links: auth read own"
  ON links FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own links.
-- (The API route explicitly sets user_id = auth.uid())
CREATE POLICY IF NOT EXISTS "links: auth insert own"
  ON links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own links.
CREATE POLICY IF NOT EXISTS "links: auth update own"
  ON links FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own links.
CREATE POLICY IF NOT EXISTS "links: auth delete own"
  ON links FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Notes
-- ============================================================
-- • Admin operations (view all, delete any) go through the service
--   role client (SUPABASE_SERVICE_ROLE_KEY) which bypasses RLS.
--   No special admin policy is needed in the database.
--
-- • Legacy links (user_id IS NULL) are only visible to admin
--   (service role). They remain functional as public redirects
--   because those routes also use the service role client.
--
-- • To reassign a legacy link to a user, run:
--   UPDATE links SET user_id = '<user-uuid>' WHERE id = '<link-id>';
-- ============================================================
