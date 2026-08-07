DROP POLICY IF EXISTS room_invites_select_available ON public.room_invites;
--> statement-breakpoint
DROP POLICY IF EXISTS room_invites_select_owner ON public.room_invites;
--> statement-breakpoint
CREATE POLICY room_invites_select_owner
ON public.room_invites
FOR SELECT
TO authenticated
USING (public.is_room_owner(room_id));
