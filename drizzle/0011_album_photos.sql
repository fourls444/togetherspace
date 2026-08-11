INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'togetherspace-album-images',
  'togetherspace-album-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  image_url text NOT NULL,
  storage_path text NOT NULL,
  caption text,
  taken_at date DEFAULT CURRENT_DATE NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT album_photos_caption_length
    CHECK (caption IS NULL OR length(btrim(caption)) <= 280),
  CONSTRAINT album_photos_sort_order_positive
    CHECK (sort_order >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS album_photos_room_sort_idx
ON public.album_photos (room_id, taken_at DESC, sort_order ASC, created_at ASC);
--> statement-breakpoint
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS album_photos_select_member ON public.album_photos;
--> statement-breakpoint
CREATE POLICY album_photos_select_member
ON public.album_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = album_photos.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS album_photos_insert_member ON public.album_photos;
--> statement-breakpoint
CREATE POLICY album_photos_insert_member
ON public.album_photos
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = album_photos.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS album_photos_update_uploader_or_owner ON public.album_photos;
--> statement-breakpoint
CREATE POLICY album_photos_update_uploader_or_owner
ON public.album_photos
FOR UPDATE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.room_members owner_member
    WHERE owner_member.room_id = album_photos.room_id
      AND owner_member.user_id = auth.uid()
      AND owner_member.role = 'owner'
  )
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.room_members owner_member
    WHERE owner_member.room_id = album_photos.room_id
      AND owner_member.user_id = auth.uid()
      AND owner_member.role = 'owner'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS album_photos_delete_uploader_or_owner ON public.album_photos;
--> statement-breakpoint
CREATE POLICY album_photos_delete_uploader_or_owner
ON public.album_photos
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.room_members owner_member
    WHERE owner_member.room_id = album_photos.room_id
      AND owner_member.user_id = auth.uid()
      AND owner_member.role = 'owner'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS storage_album_images_select ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_album_images_select
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'togetherspace-album-images');
--> statement-breakpoint
DROP POLICY IF EXISTS storage_album_images_insert_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_album_images_insert_self
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'togetherspace-album-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (storage.foldername(name))[2] = 'albums'
);
--> statement-breakpoint
DROP POLICY IF EXISTS storage_album_images_delete_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_album_images_delete_self
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'togetherspace-album-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.room_members owner_member
      WHERE owner_member.room_id::text = (storage.foldername(name))[3]
        AND owner_member.user_id = auth.uid()
        AND owner_member.role = 'owner'
    )
  )
);
