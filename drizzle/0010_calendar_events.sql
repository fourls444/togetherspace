CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  color text NOT NULL DEFAULT '#E8A055',
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT calendar_events_title_length
    CHECK (length(btrim(title)) BETWEEN 1 AND 120),
  CONSTRAINT calendar_events_color_hex
    CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS calendar_events_select_member ON public.calendar_events;
--> statement-breakpoint
CREATE POLICY calendar_events_select_member
ON public.calendar_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = calendar_events.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS calendar_events_insert_member ON public.calendar_events;
--> statement-breakpoint
CREATE POLICY calendar_events_insert_member
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = calendar_events.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS calendar_events_update_member ON public.calendar_events;
--> statement-breakpoint
CREATE POLICY calendar_events_update_member
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = calendar_events.room_id
      AND member.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = calendar_events.room_id
      AND member.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS calendar_events_delete_member ON public.calendar_events;
--> statement-breakpoint
CREATE POLICY calendar_events_delete_member
ON public.calendar_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.room_members member
    WHERE member.room_id = calendar_events.room_id
      AND member.user_id = auth.uid()
  )
);
