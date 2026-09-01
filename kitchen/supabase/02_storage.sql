-- Kitchen: Supabase Storage for recipe photos
-- Run after 01_schema.sql in the Supabase SQL Editor.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-photos',
  'recipe-photos',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "recipe_photos_service_only_select" ON storage.objects;
DROP POLICY IF EXISTS "recipe_photos_service_only_insert" ON storage.objects;
DROP POLICY IF EXISTS "recipe_photos_service_only_update" ON storage.objects;
DROP POLICY IF EXISTS "recipe_photos_service_only_delete" ON storage.objects;

-- Block direct browser access via anon/authenticated keys until the app uses signed URLs.
-- The Kitchen app currently uploads to public/uploads locally; this bucket is ready for a future switch.

CREATE POLICY "recipe_photos_service_only_select"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "recipe_photos_service_only_insert"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "recipe_photos_service_only_update"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "recipe_photos_service_only_delete"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (false);
