-- 0004_room_code.sql
-- เพิ่มคอลัมน์ room_code
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_code text;

-- สร้างรหัสสุ่มให้ห้องที่มีอยู่เดิม (ถ้ามี)
UPDATE public.rooms
SET room_code = upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6))
WHERE room_code IS NULL;

-- กำหนด Constraints
ALTER TABLE public.rooms ALTER COLUMN room_code SET NOT NULL;
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'rooms_room_code_unique'
			AND conrelid = 'public.rooms'::regclass
	) THEN
		ALTER TABLE public.rooms ADD CONSTRAINT rooms_room_code_unique UNIQUE (room_code);
	END IF;
END;
$$;

-- แก้ไขฟังก์ชัน create_room ให้สร้างรหัสห้องด้วย
CREATE OR REPLACE FUNCTION public.create_room(
	p_name text,
	p_type public.room_type,
	p_avatar_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
		RAISE EXCEPTION 'room name must contain 1 to 80 characters' USING ERRCODE = '22023';
	END IF;

	new_room_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

	INSERT INTO public.rooms (name, type, avatar_url, created_by, room_code)
	VALUES (clean_name, p_type, nullif(btrim(p_avatar_url), ''), current_user_id, new_room_code)
	RETURNING id INTO new_room_id;

	INSERT INTO public.room_members (room_id, user_id, role)
	VALUES (new_room_id, current_user_id, 'owner');

	RETURN new_room_id;
END;
$$;

-- แก้ไขฟังก์ชัน join_room_by_invite ให้รองรับการเข้าด้วยรหัสห้องโดยตรง
CREATE OR REPLACE FUNCTION public.join_room_by_invite(p_invite_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	current_user_id uuid := auth.uid();
	target_room_id uuid;
	target_invite public.room_invites%ROWTYPE;
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
	END IF;

	-- 1. Try to find room directly by room_code (Google Classroom style)
	SELECT id INTO target_room_id
	FROM public.rooms
	WHERE room_code = upper(trim(p_invite_token));

	IF target_room_id IS NOT NULL THEN
		-- Join directly if not already a member
		IF NOT EXISTS (SELECT 1 FROM public.room_members WHERE room_id = target_room_id AND user_id = current_user_id) THEN
			INSERT INTO public.room_members (room_id, user_id, role)
			VALUES (target_room_id, current_user_id, 'member');
		END IF;
		RETURN target_room_id;
	END IF;

	-- 2. If not found, try to find invite (Discord style)
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

	IF EXISTS (
		SELECT 1 FROM public.room_members
		WHERE room_id = target_invite.room_id AND user_id = current_user_id
	) THEN
		RETURN target_invite.room_id;
	END IF;

	UPDATE public.room_invites
	SET uses_count = uses_count + 1
	WHERE id = target_invite.id;

	INSERT INTO public.room_members (room_id, user_id, role)
	VALUES (target_invite.room_id, current_user_id, 'member');

	RETURN target_invite.room_id;
END;
$$;
