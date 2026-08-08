CREATE OR REPLACE FUNCTION public.create_room_invite(
	p_room_id uuid,
	p_max_uses integer DEFAULT NULL,
	p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
	id uuid,
	invite_code text,
	invite_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	current_user_id uuid := auth.uid();
	new_invite_id uuid;
	new_code text;
	new_token text;
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
	END IF;

	IF NOT public.is_room_owner(p_room_id) THEN
		RAISE EXCEPTION 'only room owner can create invite' USING ERRCODE = '42501';
	END IF;

	IF p_max_uses IS NOT NULL AND p_max_uses <= 0 THEN
		RAISE EXCEPTION 'max_uses must be greater than 0' USING ERRCODE = '22023';
	END IF;

	IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
		RAISE EXCEPTION 'expires_at must be in the future' USING ERRCODE = '22023';
	END IF;

	new_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
	new_token := gen_random_uuid()::text;

	INSERT INTO public.room_invites (
		room_id,
		invite_code,
		invite_token,
		created_by,
		max_uses,
		expires_at
	)
	VALUES (
		p_room_id,
		new_code,
		new_token,
		current_user_id,
		p_max_uses,
		p_expires_at
	)
	RETURNING room_invites.id INTO new_invite_id;

	RETURN QUERY
	SELECT ri.id, ri.invite_code, ri.invite_token
	FROM public.room_invites ri
	WHERE ri.id = new_invite_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_room_by_invite(p_invite_token text)
RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.join_room_by_code(p_invite_code text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT public.join_room_by_invite(p_invite_code);
$$;

CREATE OR REPLACE FUNCTION public.kick_member(p_room_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	current_user_id uuid := auth.uid();
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
	END IF;

	IF NOT public.is_room_owner(p_room_id) THEN
		RAISE EXCEPTION 'only room owner can kick member' USING ERRCODE = '42501';
	END IF;

	IF current_user_id = p_user_id THEN
		RAISE EXCEPTION 'cannot kick yourself' USING ERRCODE = '22023';
	END IF;

	DELETE FROM public.room_members
	WHERE room_id = p_room_id AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.change_member_role(
	p_room_id uuid,
	p_user_id uuid,
	p_new_role public.room_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	current_user_id uuid := auth.uid();
	owner_count integer;
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
	END IF;

	IF NOT public.is_room_owner(p_room_id) THEN
		RAISE EXCEPTION 'only room owner can change roles' USING ERRCODE = '42501';
	END IF;

	IF p_new_role = 'member' THEN
		SELECT count(*) INTO owner_count
		FROM public.room_members
		WHERE room_id = p_room_id AND role = 'owner';

		IF owner_count <= 1 AND EXISTS (
			SELECT 1 FROM public.room_members
			WHERE room_id = p_room_id AND user_id = p_user_id AND role = 'owner'
		) THEN
			RAISE EXCEPTION 'room must have at least one owner' USING ERRCODE = '22023';
		END IF;
	END IF;

	UPDATE public.room_members
	SET role = p_new_role
	WHERE room_id = p_room_id AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_room(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	current_user_id uuid := auth.uid();
	current_role public.room_role;
	owner_count integer;
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
	END IF;

	SELECT role INTO current_role
	FROM public.room_members
	WHERE room_id = p_room_id AND user_id = current_user_id;

	IF current_role IS NULL THEN
		RAISE EXCEPTION 'not a member of this room' USING ERRCODE = '22023';
	END IF;

	IF current_role = 'owner' THEN
		SELECT count(*) INTO owner_count
		FROM public.room_members
		WHERE room_id = p_room_id AND role = 'owner';

		IF owner_count <= 1 THEN
			RAISE EXCEPTION 'last owner cannot leave room without transferring ownership' USING ERRCODE = '22023';
		END IF;
	END IF;

	DELETE FROM public.room_members
	WHERE room_id = p_room_id AND user_id = current_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
	current_user_id uuid := auth.uid();
	target_room_id uuid;
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
	END IF;

	SELECT room_id INTO target_room_id
	FROM public.room_invites
	WHERE id = p_invite_id;

	IF target_room_id IS NULL THEN
		RAISE EXCEPTION 'invite not found' USING ERRCODE = 'P0002';
	END IF;

	IF NOT public.is_room_owner(target_room_id) THEN
		RAISE EXCEPTION 'only room owner can revoke invite' USING ERRCODE = '42501';
	END IF;

	UPDATE public.room_invites
	SET revoked_at = now()
	WHERE id = p_invite_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_room_invite(uuid, integer, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room_by_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kick_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_member_role(uuid, uuid, public.room_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invite(uuid) TO authenticated;

DROP POLICY IF EXISTS room_invites_select_public_valid ON public.room_invites;

CREATE POLICY room_invites_select_public_valid
ON public.room_invites
FOR SELECT
TO authenticated
USING (
	revoked_at IS NULL
	AND (expires_at IS NULL OR expires_at > now())
	AND (max_uses IS NULL OR uses_count < max_uses)
);
