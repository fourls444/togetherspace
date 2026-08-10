CREATE TYPE "public"."board_type" AS ENUM('main', 'notes', 'checklist', 'poll', 'custom');--> statement-breakpoint
CREATE TYPE "public"."board_item_type" AS ENUM('note', 'checklist', 'poll');--> statement-breakpoint
CREATE TABLE "boards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "name" text DEFAULT 'บอร์ดหลัก' NOT NULL,
  "board_type" "board_type" DEFAULT 'main' NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "board_id" uuid NOT NULL,
  "item_type" "board_item_type" NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "position_x" integer DEFAULT 0 NOT NULL,
  "position_y" integer DEFAULT 0 NOT NULL,
  "width" integer DEFAULT 320 NOT NULL,
  "height" integer DEFAULT 180 NOT NULL,
  "z_index" integer DEFAULT 0 NOT NULL,
  "color" text,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archived_at" timestamp with time zone,
  CONSTRAINT "board_items_width_positive" CHECK ("board_items"."width" > 0),
  CONSTRAINT "board_items_height_positive" CHECK ("board_items"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "board_checklist_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "board_item_id" uuid NOT NULL,
  "text" text NOT NULL,
  "is_done" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_poll_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "board_item_id" uuid NOT NULL,
  "label" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_poll_votes" (
  "option_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "board_poll_votes_pkey" PRIMARY KEY("option_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_items" ADD CONSTRAINT "board_items_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_items" ADD CONSTRAINT "board_items_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_checklist_items" ADD CONSTRAINT "board_checklist_items_board_item_id_board_items_id_fk" FOREIGN KEY ("board_item_id") REFERENCES "public"."board_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_poll_options" ADD CONSTRAINT "board_poll_options_board_item_id_board_items_id_fk" FOREIGN KEY ("board_item_id") REFERENCES "public"."board_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_poll_votes" ADD CONSTRAINT "board_poll_votes_option_id_board_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."board_poll_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_poll_votes" ADD CONSTRAINT "board_poll_votes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TRIGGER boards_set_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER board_items_set_updated_at
  BEFORE UPDATE ON public.board_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER board_checklist_items_set_updated_at
  BEFORE UPDATE ON public.board_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.ensure_room_board(p_room_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_board_id uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_room_member(p_room_id) THEN
    RAISE EXCEPTION 'room membership required' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO target_board_id
  FROM public.boards
  WHERE room_id = p_room_id
  ORDER BY created_at
  LIMIT 1;

  IF target_board_id IS NULL THEN
    INSERT INTO public.boards (room_id, created_by)
    VALUES (p_room_id, current_user_id)
    RETURNING id INTO target_board_id;
  END IF;

  RETURN target_board_id;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.preview_room_invite(p_invite_token text)
RETURNS TABLE (
  room_id uuid,
  room_name text,
  room_type public.room_type,
  room_avatar_url text,
  member_count bigint,
  is_already_member boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_invite public.room_invites%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO target_invite
  FROM public.room_invites
  WHERE invite_token = p_invite_token OR invite_code = upper(trim(p_invite_token));

  IF target_invite.id IS NULL THEN
    RAISE EXCEPTION 'invite not found' USING ERRCODE = 'P0002';
  END IF;

  IF target_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'invite revoked' USING ERRCODE = '22023';
  END IF;

  IF target_invite.expires_at IS NOT NULL AND target_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'invite expired' USING ERRCODE = '22023';
  END IF;

  IF target_invite.max_uses IS NOT NULL AND target_invite.uses_count >= target_invite.max_uses THEN
    RAISE EXCEPTION 'invite usage limit reached' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.type,
    r.avatar_url,
    (SELECT count(*) FROM public.room_members rm WHERE rm.room_id = r.id),
    EXISTS (
      SELECT 1 FROM public.room_members own
      WHERE own.room_id = r.id AND own.user_id = current_user_id
    )
  FROM public.rooms r
  WHERE r.id = target_invite.room_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.ensure_room_board(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.preview_room_invite(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.ensure_room_board(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.preview_room_invite(text) TO authenticated;
--> statement-breakpoint
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.board_items ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.board_checklist_items ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.board_poll_options ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.board_poll_votes ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY boards_member_all
ON public.boards
FOR ALL
TO authenticated
USING (public.is_room_member(room_id))
WITH CHECK (public.is_room_member(room_id) AND created_by = auth.uid());
--> statement-breakpoint
CREATE POLICY board_items_member_select
ON public.board_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.is_room_member(b.room_id)
  )
);
--> statement-breakpoint
CREATE POLICY board_items_member_insert
ON public.board_items
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.is_room_member(b.room_id)
  )
);
--> statement-breakpoint
CREATE POLICY board_items_member_update
ON public.board_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.is_room_member(b.room_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.is_room_member(b.room_id)
  )
);
--> statement-breakpoint
CREATE POLICY board_checklist_items_member_all
ON public.board_checklist_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.board_items bi
    INNER JOIN public.boards b ON b.id = bi.board_id
    WHERE bi.id = board_item_id AND public.is_room_member(b.room_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.board_items bi
    INNER JOIN public.boards b ON b.id = bi.board_id
    WHERE bi.id = board_item_id AND public.is_room_member(b.room_id)
  )
);
--> statement-breakpoint
CREATE POLICY board_poll_options_member_all
ON public.board_poll_options
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.board_items bi
    INNER JOIN public.boards b ON b.id = bi.board_id
    WHERE bi.id = board_item_id AND public.is_room_member(b.room_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.board_items bi
    INNER JOIN public.boards b ON b.id = bi.board_id
    WHERE bi.id = board_item_id AND public.is_room_member(b.room_id)
  )
);
--> statement-breakpoint
CREATE POLICY board_poll_votes_member_select
ON public.board_poll_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.board_poll_options bpo
    INNER JOIN public.board_items bi ON bi.id = bpo.board_item_id
    INNER JOIN public.boards b ON b.id = bi.board_id
    WHERE bpo.id = option_id AND public.is_room_member(b.room_id)
  )
);
--> statement-breakpoint
CREATE POLICY board_poll_votes_member_insert
ON public.board_poll_votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.board_poll_options bpo
    INNER JOIN public.board_items bi ON bi.id = bpo.board_item_id
    INNER JOIN public.boards b ON b.id = bi.board_id
    WHERE bpo.id = option_id AND public.is_room_member(b.room_id)
  )
);
--> statement-breakpoint
CREATE POLICY board_poll_votes_member_delete
ON public.board_poll_votes
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.board_poll_options bpo
    INNER JOIN public.board_items bi ON bi.id = bpo.board_item_id
    INNER JOIN public.boards b ON b.id = bi.board_id
    WHERE bpo.id = option_id AND public.is_room_member(b.room_id)
  )
);
