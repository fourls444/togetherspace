import {
  FinanceDashboard,
  type FinanceExpenseView,
  type FinanceMember,
  type FinanceTypeData,
} from "@/components/finance/finance-dashboard";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomContext } from "@/lib/rooms/server";
import styles from "@/components/finance/finance.module.css";

/** โหลดข้อมูลการเงินร่วมและข้อมูลเฉพาะประเภทห้องก่อนส่งให้หน้าจอแบบโต้ตอบ */
export default async function RoomFinancePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);
  if (!context.isMember) {
    return <div className={styles.stack}><ErrorState headingLevel={1} title="คุณไม่ได้อยู่ในห้องนี้" description="เข้าร่วมห้องก่อนจึงจะดูข้อมูลการเงินได้" /><ButtonLink href="/dashboard">กลับหน้าหลัก</ButtonLink></div>;
  }

  const [
    membershipsResult,
    roomProfilesResult,
    expensesResult,
    tripsResult,
    fundsResult,
    incomesResult,
    budgetsResult,
    repaymentsResult,
  ] = await Promise.all([
    context.supabase.from("room_members").select("user_id, role, profiles(display_name)").eq("room_id", context.roomId).order("joined_at"),
    context.supabase.from("room_profiles").select("user_id, display_name").eq("room_id", context.roomId),
    context.supabase.from("finance_expenses").select("id, title, amount_cents, expense_date, paid_by, created_by, category, trip_id, fund_id, note, created_at").eq("room_id", context.roomId).order("expense_date", { ascending: false }).order("created_at", { ascending: false }),
    context.supabase.from("finance_trips").select("id, name, start_date, end_date").eq("room_id", context.roomId).order("created_at", { ascending: false }),
    context.supabase.from("finance_funds").select("id, name, purpose, target_cents").eq("room_id", context.roomId).order("created_at", { ascending: false }),
    context.supabase.from("finance_incomes").select("id, user_id, source, amount_cents, income_month").eq("room_id", context.roomId).order("income_month", { ascending: false }),
    context.supabase.from("finance_budgets").select("id, category, budget_month, limit_cents").eq("room_id", context.roomId).order("budget_month", { ascending: false }),
    context.supabase.from("finance_repayments").select("id, from_user_id, to_user_id, amount_cents, repaid_at").eq("room_id", context.roomId).order("repaid_at", { ascending: false }),
  ]);

  const expenseIds = (expensesResult.data ?? []).map((expense) => expense.id);
  const fundIds = (fundsResult.data ?? []).map((fund) => fund.id);
  const [splitsResult, contributionsResult] = await Promise.all([
    expenseIds.length
      ? context.supabase.from("finance_expense_splits").select("expense_id, user_id, amount_cents").in("expense_id", expenseIds)
      : Promise.resolve({ data: [], error: null }),
    fundIds.length
      ? context.supabase.from("finance_fund_contributions").select("fund_id, amount_cents").in("fund_id", fundIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const hasDataError = [
    expensesResult.error,
    tripsResult.error,
    fundsResult.error,
    incomesResult.error,
    budgetsResult.error,
    repaymentsResult.error,
    splitsResult.error,
    contributionsResult.error,
  ].some(Boolean);
  if (hasDataError) {
    return <ErrorState headingLevel={1} title="ยังเปิดการเงินไม่ได้" description="กรุณารันไฟล์ drizzle/0013_finance.sql และ drizzle/0014_room_type_finance.sql บน Supabase ตามลำดับ แล้วรีเฟรชหน้านี้" />;
  }

  const roomProfiles = new Map((roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile.display_name]));
  const members: FinanceMember[] = (membershipsResult.data ?? []).map((membership) => {
    const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles;
    return {
      userId: membership.user_id,
      displayName: roomProfiles.get(membership.user_id) || profile?.display_name || "สมาชิก",
    };
  });

  const splitsByExpense = new Map<string, { userId: string; amountCents: number }[]>();
  for (const split of splitsResult.data ?? []) {
    const values = splitsByExpense.get(split.expense_id) ?? [];
    values.push({ userId: split.user_id, amountCents: split.amount_cents });
    splitsByExpense.set(split.expense_id, values);
  }
  const contributionByFund = new Map<string, number>();
  for (const contribution of contributionsResult.data ?? []) {
    contributionByFund.set(contribution.fund_id, (contributionByFund.get(contribution.fund_id) ?? 0) + contribution.amount_cents);
  }

  const expenses: FinanceExpenseView[] = (expensesResult.data ?? []).map((expense) => ({
    id: expense.id,
    title: expense.title,
    amountCents: expense.amount_cents,
    expenseDate: expense.expense_date,
    paidBy: expense.paid_by,
    createdBy: expense.created_by,
    category: expense.category,
    tripId: expense.trip_id,
    fundId: expense.fund_id,
    note: expense.note,
    splits: splitsByExpense.get(expense.id) ?? [],
  }));
  const typeData: FinanceTypeData = {
    trips: (tripsResult.data ?? []).map((trip) => ({ id: trip.id, name: trip.name, startDate: trip.start_date, endDate: trip.end_date })),
    funds: (fundsResult.data ?? []).map((fund) => ({ id: fund.id, name: fund.name, purpose: fund.purpose, targetCents: fund.target_cents, contributedCents: contributionByFund.get(fund.id) ?? 0 })),
    incomes: (incomesResult.data ?? []).map((income) => ({ id: income.id, userId: income.user_id, source: income.source, amountCents: income.amount_cents, incomeMonth: income.income_month })),
    budgets: (budgetsResult.data ?? []).map((budget) => ({ id: budget.id, category: budget.category, budgetMonth: budget.budget_month, limitCents: budget.limit_cents })),
    repayments: (repaymentsResult.data ?? []).map((repayment) => ({ id: repayment.id, fromUserId: repayment.from_user_id, toUserId: repayment.to_user_id, amountCents: repayment.amount_cents, repaidAt: repayment.repaid_at })),
  };
  const currentMembership = (membershipsResult.data ?? []).find((member) => member.user_id === context.currentUserId);

  return (
    <FinanceDashboard
      currentUserId={context.currentUserId}
      expenses={expenses}
      isOwner={currentMembership?.role === "owner"}
      members={members}
      roomCode={context.roomCode}
      roomId={context.roomId}
      roomType={context.room.type}
      typeData={typeData}
    />
  );
}
