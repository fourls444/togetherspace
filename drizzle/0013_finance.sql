CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  title text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  expense_date date NOT NULL,
  paid_by uuid NOT NULL REFERENCES public.profiles(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_expenses_title_length CHECK (length(btrim(title)) BETWEEN 1 AND 120)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS finance_expenses_room_date_idx
ON public.finance_expenses (room_id, expense_date DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.finance_expense_splits (
  expense_id uuid NOT NULL REFERENCES public.finance_expenses(id) ON DELETE cascade,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  PRIMARY KEY (expense_id, user_id)
);
--> statement-breakpoint
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.finance_expense_splits ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS finance_expenses_select_member ON public.finance_expenses;
--> statement-breakpoint
CREATE POLICY finance_expenses_select_member ON public.finance_expenses
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_expenses.room_id AND m.user_id = auth.uid())
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_expenses_insert_member ON public.finance_expenses;
--> statement-breakpoint
CREATE POLICY finance_expenses_insert_member ON public.finance_expenses
FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_expenses.room_id AND m.user_id = auth.uid())
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_expenses_update_author ON public.finance_expenses;
--> statement-breakpoint
CREATE POLICY finance_expenses_update_author ON public.finance_expenses
FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_expenses.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
) WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_expenses.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_expenses_delete_author ON public.finance_expenses;
--> statement-breakpoint
CREATE POLICY finance_expenses_delete_author ON public.finance_expenses
FOR DELETE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_expenses.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_splits_select_member ON public.finance_expense_splits;
--> statement-breakpoint
CREATE POLICY finance_splits_select_member ON public.finance_expense_splits
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.finance_expenses e
    JOIN public.room_members m ON m.room_id = e.room_id
    WHERE e.id = finance_expense_splits.expense_id AND m.user_id = auth.uid()
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_splits_mutate_author ON public.finance_expense_splits;
--> statement-breakpoint
CREATE POLICY finance_splits_mutate_author ON public.finance_expense_splits
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.finance_expenses e
    LEFT JOIN public.room_members m ON m.room_id = e.room_id AND m.user_id = auth.uid()
    WHERE e.id = finance_expense_splits.expense_id AND (e.created_by = auth.uid() OR m.role = 'owner')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.finance_expenses e
    LEFT JOIN public.room_members m ON m.room_id = e.room_id AND m.user_id = auth.uid()
    WHERE e.id = finance_expense_splits.expense_id AND (e.created_by = auth.uid() OR m.role = 'owner')
  )
);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.save_finance_expense(
  p_expense_id uuid,
  p_room_id uuid,
  p_title text,
  p_amount_cents integer,
  p_expense_date date,
  p_paid_by uuid,
  p_note text,
  p_splits jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_expense_id uuid;
  v_split_total bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM room_members WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN RAISE EXCEPTION 'not_room_member'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM room_members WHERE room_id = p_room_id AND user_id = p_paid_by
  ) THEN RAISE EXCEPTION 'payer_not_room_member'; END IF;

  IF jsonb_array_length(p_splits) = 0 OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_splits) item
    WHERE NOT EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = p_room_id AND user_id = (item->>'userId')::uuid
    )
  ) THEN RAISE EXCEPTION 'participant_not_room_member'; END IF;

  SELECT sum((item->>'amountCents')::integer)
  INTO v_split_total FROM jsonb_array_elements(p_splits) item;
  IF v_split_total <> p_amount_cents THEN RAISE EXCEPTION 'split_total_mismatch'; END IF;

  IF p_expense_id IS NULL THEN
    INSERT INTO finance_expenses (room_id, title, amount_cents, expense_date, paid_by, created_by, note)
    VALUES (p_room_id, btrim(p_title), p_amount_cents, p_expense_date, p_paid_by, auth.uid(), nullif(btrim(p_note), ''))
    RETURNING id INTO v_expense_id;
  ELSE
    UPDATE finance_expenses SET
      title = btrim(p_title), amount_cents = p_amount_cents, expense_date = p_expense_date,
      paid_by = p_paid_by, note = nullif(btrim(p_note), ''), updated_at = now()
    WHERE id = p_expense_id AND room_id = p_room_id
    RETURNING id INTO v_expense_id;
    IF v_expense_id IS NULL THEN RAISE EXCEPTION 'expense_not_editable'; END IF;
    DELETE FROM finance_expense_splits WHERE expense_id = v_expense_id;
  END IF;

  INSERT INTO finance_expense_splits (expense_id, user_id, amount_cents)
  SELECT v_expense_id, (item->>'userId')::uuid, (item->>'amountCents')::integer
  FROM jsonb_array_elements(p_splits) item;
  RETURN v_expense_id;
END;
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.save_finance_expense(uuid, uuid, text, integer, date, uuid, text, jsonb) TO authenticated;
