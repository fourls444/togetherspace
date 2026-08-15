CREATE TABLE IF NOT EXISTS public.friend_profiles (
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text,
  facebook_url text,
  line_id text,
  instagram_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id),
  CONSTRAINT friend_profiles_bio_length CHECK (bio IS NULL OR length(btrim(bio)) <= 500),
  CONSTRAINT friend_profiles_line_length CHECK (line_id IS NULL OR length(btrim(line_id)) <= 80),
  CONSTRAINT friend_profiles_phone_length CHECK (phone IS NULL OR length(btrim(phone)) <= 30)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS friend_profiles_room_idx
ON public.friend_profiles (room_id);
--> statement-breakpoint
ALTER TABLE public.friend_profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS friend_profiles_select_member ON public.friend_profiles;
--> statement-breakpoint
CREATE POLICY friend_profiles_select_member
ON public.friend_profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = friend_profiles.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'friend'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS friend_profiles_insert_self ON public.friend_profiles;
--> statement-breakpoint
CREATE POLICY friend_profiles_insert_self
ON public.friend_profiles FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = friend_profiles.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'friend'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS friend_profiles_update_self ON public.friend_profiles;
--> statement-breakpoint
CREATE POLICY friend_profiles_update_self
ON public.friend_profiles FOR UPDATE TO authenticated USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = friend_profiles.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'friend'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS friend_profiles_delete_self ON public.friend_profiles;
--> statement-breakpoint
CREATE POLICY friend_profiles_delete_self
ON public.friend_profiles FOR DELETE TO authenticated USING (user_id = auth.uid());
