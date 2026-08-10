CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := lpad(floor(random() * 1000000)::int::text, 6, '0');

    IF NOT EXISTS (
      SELECT 1
      FROM public.rooms
      WHERE room_code = candidate
    ) THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.generate_room_code() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.generate_room_code() TO authenticated;
--> statement-breakpoint
DO $$
DECLARE
  target_room record;
  candidate text;
BEGIN
  FOR target_room IN
    SELECT id
    FROM public.rooms
    WHERE room_code !~ '^\d{6}$'
  LOOP
    LOOP
      candidate := public.generate_room_code();

      IF NOT EXISTS (
        SELECT 1
        FROM public.rooms
        WHERE room_code = candidate
          AND id <> target_room.id
      ) THEN
        UPDATE public.rooms
        SET room_code = candidate
        WHERE id = target_room.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.create_room(
  p_name text,
  p_type public.room_type,
  p_avatar_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  new_room_id uuid;
  clean_name text := btrim(p_name);
  new_room_code text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  IF clean_name = '' OR length(clean_name) > 80 THEN
    RAISE EXCEPTION 'invalid room name' USING ERRCODE = '22023';
  END IF;

  new_room_code := public.generate_room_code();

  INSERT INTO public.rooms (name, type, avatar_url, created_by, room_code)
  VALUES (clean_name, p_type, nullif(btrim(p_avatar_url), ''), current_user_id, new_room_code)
  RETURNING id INTO new_room_id;

  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (new_room_id, current_user_id, 'owner');

  RETURN new_room_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_room(text, public.room_type, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_room(text, public.room_type, text) TO authenticated;
