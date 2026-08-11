ALTER TABLE public.calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_color_hex;
--> statement-breakpoint
ALTER TABLE public.calendar_events
DROP COLUMN IF EXISTS color;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.room_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  name text NOT NULL,
  description text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  place_date date,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT room_places_name_length
    CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  CONSTRAINT room_places_description_length
    CHECK (description IS NULL OR length(btrim(description)) <= 1000),
  CONSTRAINT room_places_latitude_range
    CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT room_places_longitude_range
    CHECK (longitude BETWEEN -180 AND 180)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS room_places_room_created_idx
ON public.room_places (room_id, created_at DESC);
--> statement-breakpoint
ALTER TABLE public.room_places ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS room_places_select_member ON public.room_places;
--> statement-breakpoint
CREATE POLICY room_places_select_member
ON public.room_places
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = room_places.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS room_places_insert_member ON public.room_places;
--> statement-breakpoint
CREATE POLICY room_places_insert_member
ON public.room_places
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = room_places.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS room_places_update_member ON public.room_places;
--> statement-breakpoint
CREATE POLICY room_places_update_member
ON public.room_places
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = room_places.room_id
      AND member.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = room_places.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS room_places_delete_member ON public.room_places;
--> statement-breakpoint
CREATE POLICY room_places_delete_member
ON public.room_places
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = room_places.room_id
      AND member.user_id = auth.uid()
  )
);
