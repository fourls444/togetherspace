CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE cascade,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS room_messages_room_created_idx ON public.room_messages (room_id, created_at DESC);
--> statement-breakpoint
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
--> statement-breakpoint
DROP POLICY IF EXISTS room_messages_select_member ON public.room_messages;
CREATE POLICY room_messages_select_member ON public.room_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.room_members m
    WHERE m.room_id = room_messages.room_id AND m.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS room_messages_insert_member ON public.room_messages;
CREATE POLICY room_messages_insert_member ON public.room_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.room_members m
    WHERE m.room_id = room_messages.room_id AND m.user_id = auth.uid()
  )
);
