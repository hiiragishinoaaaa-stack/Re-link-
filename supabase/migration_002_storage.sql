-- Create public storage bucket for link images.
-- Run this in the Supabase SQL editor or via `supabase db push`.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'link-images',
  'link-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Public read (redundant when bucket.public = true, but explicit is safer)
CREATE POLICY IF NOT EXISTS "link-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'link-images');

-- Allow anonymous uploads (used by the /api/upload server route with anon key)
CREATE POLICY IF NOT EXISTS "link-images: anon upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'link-images');

-- Allow deletion so images can be cleaned up if needed
CREATE POLICY IF NOT EXISTS "link-images: anon delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'link-images');
