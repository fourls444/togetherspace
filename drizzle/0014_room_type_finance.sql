CREATE TABLE IF NOT EXISTS public.finance_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  start_date date,
  end_date date,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_trips_date_order CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS finance_trips_room_date_idx ON public.finance_trips (room_id, start_date DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.finance_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  purpose text NOT NULL CHECK (purpose IN ('trip', 'date')),
  target_cents integer CHECK (target_cents IS NULL OR target_cents > 0),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS finance_funds_room_created_idx ON public.finance_funds (room_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.finance_fund_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.finance_funds(id) ON DELETE cascade,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  contribution_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS finance_contributions_fund_date_idx ON public.finance_fund_contributions (fund_id, contribution_date DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.finance_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  source text NOT NULL CHECK (length(btrim(source)) BETWEEN 1 AND 120),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  income_month date NOT NULL CHECK (date_trunc('month', income_month)::date = income_month),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS finance_incomes_room_month_idx ON public.finance_incomes (room_id, income_month DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.finance_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  category text NOT NULL CHECK (length(btrim(category)) BETWEEN 1 AND 80),
  budget_month date NOT NULL CHECK (date_trunc('month', budget_month)::date = budget_month),
  limit_cents integer NOT NULL CHECK (limit_cents > 0),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, category, budget_month)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS finance_budgets_room_month_idx ON public.finance_budgets (room_id, budget_month DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.finance_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE cascade,
  from_user_id uuid NOT NULL REFERENCES public.profiles(id),
  to_user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  repaid_at date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_repayments_different_members CHECK (from_user_id <> to_user_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS finance_repayments_room_date_idx ON public.finance_repayments (room_id, repaid_at DESC);
--> statement-breakpoint
ALTER TABLE public.finance_expenses
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'อื่นๆ',
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.finance_trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fund_id uuid REFERENCES public.finance_funds(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE public.finance_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_fund_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_repayments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS finance_trips_select_member ON public.finance_trips;
CREATE POLICY finance_trips_select_member ON public.finance_trips FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_trips.room_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS finance_trips_insert_member ON public.finance_trips;
CREATE POLICY finance_trips_insert_member ON public.finance_trips FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.room_members m JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = finance_trips.room_id AND m.user_id = auth.uid() AND r.type = 'friend'
  )
);
DROP POLICY IF EXISTS finance_trips_manage_author ON public.finance_trips;
CREATE POLICY finance_trips_manage_author ON public.finance_trips FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_trips.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
) WITH CHECK (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_trips.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
DROP POLICY IF EXISTS finance_trips_delete_author ON public.finance_trips;
CREATE POLICY finance_trips_delete_author ON public.finance_trips FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_trips.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_funds_select_member ON public.finance_funds;
CREATE POLICY finance_funds_select_member ON public.finance_funds FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_funds.room_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS finance_funds_insert_member ON public.finance_funds;
CREATE POLICY finance_funds_insert_member ON public.finance_funds FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.room_members m JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = finance_funds.room_id AND m.user_id = auth.uid()
      AND ((r.type = 'friend' AND finance_funds.purpose = 'trip') OR (r.type = 'couple' AND finance_funds.purpose = 'date'))
  )
);
DROP POLICY IF EXISTS finance_funds_manage_author ON public.finance_funds;
CREATE POLICY finance_funds_manage_author ON public.finance_funds FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_funds.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
) WITH CHECK (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_funds.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
DROP POLICY IF EXISTS finance_funds_delete_author ON public.finance_funds;
CREATE POLICY finance_funds_delete_author ON public.finance_funds FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_funds.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_contributions_select_member ON public.finance_fund_contributions;
CREATE POLICY finance_contributions_select_member ON public.finance_fund_contributions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.finance_funds f JOIN public.room_members m ON m.room_id = f.room_id WHERE f.id = finance_fund_contributions.fund_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS finance_contributions_insert_member ON public.finance_fund_contributions;
CREATE POLICY finance_contributions_insert_member ON public.finance_fund_contributions FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.finance_funds f JOIN public.room_members m ON m.room_id = f.room_id
    WHERE f.id = finance_fund_contributions.fund_id AND m.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS finance_contributions_delete_author ON public.finance_fund_contributions;
CREATE POLICY finance_contributions_delete_author ON public.finance_fund_contributions FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.finance_funds f JOIN public.room_members m ON m.room_id = f.room_id
    WHERE f.id = finance_fund_contributions.fund_id AND m.user_id = auth.uid() AND m.role = 'owner'
  )
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_incomes_select_member ON public.finance_incomes;
CREATE POLICY finance_incomes_select_member ON public.finance_incomes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_incomes.room_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS finance_incomes_insert_member ON public.finance_incomes;
CREATE POLICY finance_incomes_insert_member ON public.finance_incomes FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.room_members m JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = finance_incomes.room_id AND m.user_id = auth.uid() AND r.type = 'family'
  ) AND EXISTS (
    SELECT 1 FROM public.room_members income_owner
    WHERE income_owner.room_id = finance_incomes.room_id AND income_owner.user_id = finance_incomes.user_id
  )
);
DROP POLICY IF EXISTS finance_incomes_manage_author ON public.finance_incomes;
CREATE POLICY finance_incomes_manage_author ON public.finance_incomes FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_incomes.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
) WITH CHECK (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_incomes.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
DROP POLICY IF EXISTS finance_incomes_delete_author ON public.finance_incomes;
CREATE POLICY finance_incomes_delete_author ON public.finance_incomes FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_incomes.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_budgets_select_member ON public.finance_budgets;
CREATE POLICY finance_budgets_select_member ON public.finance_budgets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_budgets.room_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS finance_budgets_insert_member ON public.finance_budgets;
CREATE POLICY finance_budgets_insert_member ON public.finance_budgets FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.room_members m JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = finance_budgets.room_id AND m.user_id = auth.uid() AND r.type = 'family'
  )
);
DROP POLICY IF EXISTS finance_budgets_manage_author ON public.finance_budgets;
CREATE POLICY finance_budgets_manage_author ON public.finance_budgets FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_budgets.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
) WITH CHECK (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_budgets.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
DROP POLICY IF EXISTS finance_budgets_delete_author ON public.finance_budgets;
CREATE POLICY finance_budgets_delete_author ON public.finance_budgets FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_budgets.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
--> statement-breakpoint
DROP POLICY IF EXISTS finance_repayments_select_member ON public.finance_repayments;
CREATE POLICY finance_repayments_select_member ON public.finance_repayments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_repayments.room_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS finance_repayments_insert_member ON public.finance_repayments;
CREATE POLICY finance_repayments_insert_member ON public.finance_repayments FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.room_members m JOIN public.rooms r ON r.id = m.room_id
    WHERE m.room_id = finance_repayments.room_id AND m.user_id = auth.uid() AND r.type = 'friend'
  ) AND EXISTS (
    SELECT 1 FROM public.room_members payer
    WHERE payer.room_id = finance_repayments.room_id AND payer.user_id = finance_repayments.from_user_id
  ) AND EXISTS (
    SELECT 1 FROM public.room_members receiver
    WHERE receiver.room_id = finance_repayments.room_id AND receiver.user_id = finance_repayments.to_user_id
  )
);
DROP POLICY IF EXISTS finance_repayments_delete_author ON public.finance_repayments;
CREATE POLICY finance_repayments_delete_author ON public.finance_repayments FOR DELETE TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.room_members m WHERE m.room_id = finance_repayments.room_id AND m.user_id = auth.uid() AND m.role = 'owner')
);
--> statement-breakpoint
DROP FUNCTION IF EXISTS public.save_finance_expense(uuid, uuid, text, integer, date, uuid, text, jsonb);
--> statement-breakpoint
CREATE FUNCTION public.save_finance_expense(
  p_expense_id uuid,
  p_room_id uuid,
  p_title text,
  p_amount_cents integer,
  p_expense_date date,
  p_paid_by uuid,
  p_category text,
  p_trip_id uuid,
  p_fund_id uuid,
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

  IF p_trip_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM finance_trips WHERE id = p_trip_id AND room_id = p_room_id
  ) THEN RAISE EXCEPTION 'trip_not_in_room'; END IF;

  IF p_fund_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM finance_funds WHERE id = p_fund_id AND room_id = p_room_id
  ) THEN RAISE EXCEPTION 'fund_not_in_room'; END IF;

  IF jsonb_array_length(p_splits) = 0 OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_splits) item
    WHERE NOT EXISTS (
      SELECT 1 FROM room_members WHERE room_id = p_room_id AND user_id = (item->>'userId')::uuid
    )
  ) THEN RAISE EXCEPTION 'participant_not_room_member'; END IF;

  SELECT sum((item->>'amountCents')::integer) INTO v_split_total
  FROM jsonb_array_elements(p_splits) item;
  IF v_split_total <> p_amount_cents THEN RAISE EXCEPTION 'split_total_mismatch'; END IF;

  IF p_expense_id IS NULL THEN
    INSERT INTO finance_expenses (
      room_id, title, amount_cents, expense_date, paid_by, created_by, category, trip_id, fund_id, note
    ) VALUES (
      p_room_id, btrim(p_title), p_amount_cents, p_expense_date, p_paid_by, auth.uid(),
      btrim(p_category), p_trip_id, p_fund_id, nullif(btrim(p_note), '')
    ) RETURNING id INTO v_expense_id;
  ELSE
    UPDATE finance_expenses SET
      title = btrim(p_title), amount_cents = p_amount_cents, expense_date = p_expense_date,
      paid_by = p_paid_by, category = btrim(p_category), trip_id = p_trip_id, fund_id = p_fund_id,
      note = nullif(btrim(p_note), ''), updated_at = now()
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
GRANT EXECUTE ON FUNCTION public.save_finance_expense(uuid, uuid, text, integer, date, uuid, text, uuid, uuid, text, jsonb) TO authenticated;
