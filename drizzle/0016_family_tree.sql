CREATE TABLE IF NOT EXISTS public.family_tree_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  room_member_user_id uuid REFERENCES public.profiles(id) ON DELETE set null,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'child',
  avatar_url text,
  position_x integer NOT NULL DEFAULT 160,
  position_y integer NOT NULL DEFAULT 120,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_tree_people_name_length CHECK (length(btrim(display_name)) BETWEEN 1 AND 80),
  CONSTRAINT family_tree_people_role CHECK (role IN ('parent', 'child', 'sibling'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS family_tree_people_room_idx
ON public.family_tree_people (room_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS family_tree_people_room_member_unique
ON public.family_tree_people (room_id, room_member_user_id)
WHERE room_member_user_id IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.family_tree_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  from_person_id uuid NOT NULL REFERENCES public.family_tree_people(id) ON DELETE cascade,
  to_person_id uuid NOT NULL REFERENCES public.family_tree_people(id) ON DELETE cascade,
  relationship_type text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_tree_relationship_type CHECK (relationship_type IN ('parent_child', 'sibling')),
  CONSTRAINT family_tree_relationship_not_self CHECK (from_person_id <> to_person_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS family_tree_relationship_room_idx
ON public.family_tree_relationships (room_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS family_tree_relationship_unique
ON public.family_tree_relationships (room_id, from_person_id, to_person_id, relationship_type);
--> statement-breakpoint
ALTER TABLE public.family_tree_people ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.family_tree_relationships ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS family_tree_people_select_family_member ON public.family_tree_people;
--> statement-breakpoint
CREATE POLICY family_tree_people_select_family_member
ON public.family_tree_people FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_people.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS family_tree_people_insert_family_member ON public.family_tree_people;
--> statement-breakpoint
CREATE POLICY family_tree_people_insert_family_member
ON public.family_tree_people FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_people.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS family_tree_people_update_family_member ON public.family_tree_people;
--> statement-breakpoint
CREATE POLICY family_tree_people_update_family_member
ON public.family_tree_people FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_people.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_people.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS family_tree_people_delete_family_member ON public.family_tree_people;
--> statement-breakpoint
CREATE POLICY family_tree_people_delete_family_member
ON public.family_tree_people FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_people.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS family_tree_relationships_select_family_member ON public.family_tree_relationships;
--> statement-breakpoint
CREATE POLICY family_tree_relationships_select_family_member
ON public.family_tree_relationships FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_relationships.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS family_tree_relationships_mutate_family_member ON public.family_tree_relationships;
--> statement-breakpoint
CREATE POLICY family_tree_relationships_mutate_family_member
ON public.family_tree_relationships FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_relationships.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
) WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.room_members m
    JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = family_tree_relationships.room_id
      AND m.user_id = auth.uid()
      AND r.type = 'family'
  )
);
