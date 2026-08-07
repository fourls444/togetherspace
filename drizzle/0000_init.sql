CREATE TYPE "public"."room_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('friend', 'couple', 'family');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "room_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"invite_token" text NOT NULL,
	"created_by" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_invites_invite_code_unique" UNIQUE("invite_code"),
	CONSTRAINT "room_invites_invite_token_unique" UNIQUE("invite_token"),
	CONSTRAINT "room_invites_max_uses_positive" CHECK ("room_invites"."max_uses" > 0),
	CONSTRAINT "room_invites_uses_count_nonnegative" CHECK ("room_invites"."uses_count" >= 0),
	CONSTRAINT "room_invites_uses_within_limit" CHECK ("room_invites"."max_uses" is null or "room_invites"."uses_count" <= "room_invites"."max_uses")
);
--> statement-breakpoint
CREATE TABLE "room_members" (
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "room_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_opened_at" timestamp with time zone,
	CONSTRAINT "room_members_pkey" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "room_type" NOT NULL,
	"avatar_url" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_invites" ADD CONSTRAINT "room_invites_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_invites" ADD CONSTRAINT "room_invites_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_auth_users_fk
FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.profile_username(
	user_email text,
	user_id uuid
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
	SELECT left(
		CASE
			WHEN length(regexp_replace(lower(split_part(coalesce(user_email, ''), '@', 1)), '[^a-z0-9_]', '', 'g')) >= 3
				THEN regexp_replace(lower(split_part(coalesce(user_email, ''), '@', 1)), '[^a-z0-9_]', '', 'g')
			ELSE 'user'
		END,
		20
	) || '_' || left(replace(user_id::text, '-', ''), 8)
$$;
--> statement-breakpoint
INSERT INTO public.profiles (id, username, display_name)
SELECT
	u.id,
	public.profile_username(u.email, u.id),
	coalesce(
		nullif(u.raw_user_meta_data ->> 'display_name', ''),
		nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
		'TogetherSpace user'
	)
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
	INSERT INTO public.profiles (id, username, display_name, avatar_url)
	VALUES (
		new.id,
		public.profile_username(new.email, new.id),
		coalesce(
			nullif(new.raw_user_meta_data ->> 'display_name', ''),
			nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
			'TogetherSpace user'
		),
		nullif(new.raw_user_meta_data ->> 'avatar_url', '')
	)
	ON CONFLICT (id) DO NOTHING;

	RETURN new;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
	AFTER INSERT ON auth.users
	FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
	new.updated_at = now();
	RETURN new;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER profiles_set_updated_at
	BEFORE UPDATE ON public.profiles
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER rooms_set_updated_at
	BEFORE UPDATE ON public.rooms
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_room_member(target_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.room_members
		WHERE room_id = target_room_id
			AND user_id = auth.uid()
	)
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_room_owner(target_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.room_members
		WHERE room_id = target_room_id
			AND user_id = auth.uid()
			AND role = 'owner'
	)
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.shares_room_with(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
	SELECT target_user_id = auth.uid() OR EXISTS (
		SELECT 1
		FROM public.room_members AS own_membership
		INNER JOIN public.room_members AS other_membership
			ON other_membership.room_id = own_membership.room_id
		WHERE own_membership.user_id = auth.uid()
			AND other_membership.user_id = target_user_id
	)
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
SET search_path = ''
AS $$
DECLARE
	current_user_id uuid := auth.uid();
	new_room_id uuid;
	clean_name text := btrim(p_name);
BEGIN
	IF current_user_id IS NULL THEN
		RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
	END IF;

	IF clean_name = '' OR length(clean_name) > 80 THEN
		RAISE EXCEPTION 'room name must contain 1 to 80 characters' USING ERRCODE = '22023';
	END IF;

	INSERT INTO public.rooms (name, type, avatar_url, created_by)
	VALUES (clean_name, p_type, nullif(btrim(p_avatar_url), ''), current_user_id)
	RETURNING id INTO new_room_id;

	INSERT INTO public.room_members (room_id, user_id, role)
	VALUES (new_room_id, current_user_id, 'owner');

	RETURN new_room_id;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.profile_username(text, uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.is_room_member(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.is_room_owner(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.shares_room_with(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_room(text, public.room_type, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.is_room_owner(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.shares_room_with(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_room(text, public.room_type, text) TO authenticated;
--> statement-breakpoint
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.room_invites ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY profiles_select_visible
ON public.profiles
FOR SELECT
TO authenticated
USING (public.shares_room_with(id));
--> statement-breakpoint
CREATE POLICY profiles_update_self
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
--> statement-breakpoint
CREATE POLICY rooms_select_member
ON public.rooms
FOR SELECT
TO authenticated
USING (public.is_room_member(id));
--> statement-breakpoint
CREATE POLICY rooms_update_owner
ON public.rooms
FOR UPDATE
TO authenticated
USING (public.is_room_owner(id))
WITH CHECK (public.is_room_owner(id));
--> statement-breakpoint
CREATE POLICY rooms_delete_owner
ON public.rooms
FOR DELETE
TO authenticated
USING (public.is_room_owner(id));
--> statement-breakpoint
CREATE POLICY room_members_select_member
ON public.room_members
FOR SELECT
TO authenticated
USING (public.is_room_member(room_id));
--> statement-breakpoint
CREATE POLICY room_members_insert_owner
ON public.room_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_room_owner(room_id));
--> statement-breakpoint
CREATE POLICY room_members_update_owner
ON public.room_members
FOR UPDATE
TO authenticated
USING (public.is_room_owner(room_id))
WITH CHECK (public.is_room_owner(room_id));
--> statement-breakpoint
CREATE POLICY room_members_delete_owner
ON public.room_members
FOR DELETE
TO authenticated
USING (public.is_room_owner(room_id));
--> statement-breakpoint
CREATE POLICY room_invites_select_owner
ON public.room_invites
FOR SELECT
TO authenticated
USING (public.is_room_owner(room_id));
--> statement-breakpoint
CREATE POLICY room_invites_insert_owner
ON public.room_invites
FOR INSERT
TO authenticated
WITH CHECK (
	public.is_room_owner(room_id)
	AND created_by = auth.uid()
);
--> statement-breakpoint
CREATE POLICY room_invites_update_owner
ON public.room_invites
FOR UPDATE
TO authenticated
USING (public.is_room_owner(room_id))
WITH CHECK (public.is_room_owner(room_id));
--> statement-breakpoint
CREATE POLICY room_invites_delete_owner
ON public.room_invites
FOR DELETE
TO authenticated
USING (public.is_room_owner(room_id));
