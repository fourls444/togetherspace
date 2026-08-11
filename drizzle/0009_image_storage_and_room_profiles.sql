INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'togetherspace-profile-images',
    'togetherspace-profile-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'togetherspace-room-images',
    'togetherspace-room-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.room_profiles (
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT room_profiles_pk PRIMARY KEY (room_id, user_id),
  CONSTRAINT room_profiles_member_fk
    FOREIGN KEY (room_id, user_id)
    REFERENCES public.room_members(room_id, user_id)
    ON DELETE cascade,
  CONSTRAINT room_profiles_display_name_check
    CHECK (
      display_name IS NULL
      OR (length(btrim(display_name)) BETWEEN 1 AND 80)
    )
);
--> statement-breakpoint
ALTER TABLE public.room_profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS room_profiles_select_member ON public.room_profiles;
--> statement-breakpoint
CREATE POLICY room_profiles_select_member
ON public.room_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members viewer
    WHERE viewer.room_id = room_profiles.room_id
      AND viewer.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS room_profiles_insert_self ON public.room_profiles;
--> statement-breakpoint
CREATE POLICY room_profiles_insert_self
ON public.room_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members viewer
    WHERE viewer.room_id = room_profiles.room_id
      AND viewer.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS room_profiles_update_self ON public.room_profiles;
--> statement-breakpoint
CREATE POLICY room_profiles_update_self
ON public.room_profiles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members viewer
    WHERE viewer.room_id = room_profiles.room_id
      AND viewer.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members viewer
    WHERE viewer.room_id = room_profiles.room_id
      AND viewer.user_id = auth.uid()
  )
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.update_room_profile(
  p_room_id uuid,
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  clean_display_name text := nullif(btrim(coalesce(p_display_name, '')), '');
  clean_avatar_url text := nullif(btrim(coalesce(p_avatar_url, '')), '');
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE room_id = p_room_id
      AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'room membership required' USING ERRCODE = '42501';
  END IF;

  IF clean_display_name IS NOT NULL AND length(clean_display_name) > 80 THEN
    RAISE EXCEPTION 'display name must be 1-80 characters' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.room_profiles (
    room_id,
    user_id,
    display_name,
    avatar_url,
    updated_at
  )
  VALUES (
    p_room_id,
    current_user_id,
    clean_display_name,
    clean_avatar_url,
    now()
  )
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.update_room_profile(uuid, text, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.update_room_profile(uuid, text, text) TO authenticated;
--> statement-breakpoint
DROP POLICY IF EXISTS storage_profile_images_select ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_profile_images_select
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'togetherspace-profile-images');
--> statement-breakpoint
DROP POLICY IF EXISTS storage_profile_images_insert_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_profile_images_insert_self
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'togetherspace-profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
--> statement-breakpoint
DROP POLICY IF EXISTS storage_profile_images_update_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_profile_images_update_self
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'togetherspace-profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'togetherspace-profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
--> statement-breakpoint
DROP POLICY IF EXISTS storage_profile_images_delete_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_profile_images_delete_self
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'togetherspace-profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
--> statement-breakpoint
DROP POLICY IF EXISTS storage_room_images_select ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_room_images_select
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'togetherspace-room-images');
--> statement-breakpoint
DROP POLICY IF EXISTS storage_room_images_insert_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_room_images_insert_self
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'togetherspace-room-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
--> statement-breakpoint
DROP POLICY IF EXISTS storage_room_images_update_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_room_images_update_self
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'togetherspace-room-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'togetherspace-room-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
--> statement-breakpoint
DROP POLICY IF EXISTS storage_room_images_delete_self ON storage.objects;
--> statement-breakpoint
CREATE POLICY storage_room_images_delete_self
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'togetherspace-room-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
