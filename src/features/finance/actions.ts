"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createFinanceFundSchema,
  createFinanceIncomeSchema,
  createFinanceRepaymentSchema,
  createFinanceTripSchema,
  createFinanceExpenseSchema,
  createFundContributionSchema,
  deleteFinanceExpenseSchema,
  moneyToCents,
  splitEqually,
  updateFinanceExpenseSchema,
  upsertFinanceBudgetSchema,
} from "@/features/finance/validation";
import { isFinanceCategoryAllowed } from "@/lib/finance/room-type";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";
import type { RoomType } from "@/lib/types/database";

export type FinanceActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

function readJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** แปลงช่องว่างจากฟอร์มเป็น null ก่อนส่งให้ schema */
function nullableText(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** คืนผู้ใช้ปัจจุบันสำหรับ mutation การเงิน และพาไป login เมื่อ session หมดอายุ */
async function requireFinanceUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

/** ตรวจว่าผู้จ่ายและผู้ร่วมจ่ายยังเป็นสมาชิกของห้องก่อนเรียกฐานข้อมูล */
async function validateFinanceMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  userIds: string[],
) {
  const uniqueIds = [...new Set(userIds)];
  const { data, error } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", roomId)
    .in("user_id", uniqueIds);
  return !error && (data?.length ?? 0) === uniqueIds.length;
}

/** ตรวจประเภทห้องจากฐานข้อมูลแทนการเชื่อค่าที่ส่งมาจากหน้าเว็บ */
async function validateFinanceRoomType(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  allowedTypes: RoomType[],
) {
  const { data, error } = await supabase.from("rooms").select("type").eq("id", roomId).maybeSingle();
  return !error && Boolean(data && allowedTypes.includes(data.type));
}

/** สร้างรายการแบ่งยอดจากโหมดเท่ากันหรือยอดที่กรอกเอง */
function buildSplits(input: {
  amountCents: number;
  customAmounts: Record<string, string>;
  participantIds: string[];
  splitMode: "equal" | "custom";
}) {
  if (input.splitMode === "equal") {
    return splitEqually(input.amountCents, input.participantIds);
  }
  return input.participantIds.map((userId) => ({
    userId,
    amountCents: moneyToCents(input.customAmounts[userId] ?? "0"),
  }));
}

function revalidateFinance(roomCode: string) {
  revalidatePath(getRoomSubPath(roomCode, "finance"));
}

/** สร้างค่าใช้จ่ายและยอดแบ่งของสมาชิกภายใน transaction ฝั่งฐานข้อมูล */
export async function createFinanceExpense(
  _previous: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const result = createFinanceExpenseSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    roomType: formData.get("roomType"),
    title: formData.get("title"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    paidBy: formData.get("paidBy"),
    category: formData.get("category"),
    tripId: nullableText(formData.get("tripId")),
    fundId: nullableText(formData.get("fundId")),
    splitMode: formData.get("splitMode"),
    participantIds: readJson(formData.get("participantIds"), []),
    customAmounts: readJson(formData.get("customAmounts"), {}),
    note: formData.get("note"),
  });
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { supabase } = await requireFinanceUser();
  if (!isFinanceCategoryAllowed(result.data.roomType, result.data.category)) {
    return { error: "หมวดค่าใช้จ่ายไม่ตรงกับประเภทห้อง" };
  }
  if (!(await validateFinanceRoomType(supabase, result.data.roomId, [result.data.roomType]))) {
    return { error: "ประเภทห้องไม่ตรงกับข้อมูลที่ส่งมา" };
  }
  const membersAreValid = await validateFinanceMembers(supabase, result.data.roomId, [
    result.data.paidBy,
    ...result.data.participantIds,
  ]);
  if (!membersAreValid) return { error: "ผู้จ่ายและผู้ร่วมจ่ายต้องเป็นสมาชิกในห้อง" };
  const { error } = await supabase.rpc("save_finance_expense", {
    p_expense_id: null,
    p_room_id: result.data.roomId,
    p_title: result.data.title,
    p_amount_cents: result.data.amountCents,
    p_expense_date: result.data.expenseDate,
    p_paid_by: result.data.paidBy,
    p_category: result.data.category,
    p_trip_id: result.data.tripId,
    p_fund_id: result.data.fundId,
    p_note: result.data.note,
    p_splits: buildSplits(result.data) as unknown as Json,
  });
  if (error) return { error: `บันทึกค่าใช้จ่ายไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** แก้ไขค่าใช้จ่ายเดิม ผู้สร้างหรือเจ้าของห้องเท่านั้นที่ผ่านสิทธิ์ฐานข้อมูล */
export async function updateFinanceExpense(formData: FormData): Promise<FinanceActionState> {
  const result = updateFinanceExpenseSchema.safeParse({
    expenseId: formData.get("expenseId"),
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    roomType: formData.get("roomType"),
    title: formData.get("title"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    paidBy: formData.get("paidBy"),
    category: formData.get("category"),
    tripId: nullableText(formData.get("tripId")),
    fundId: nullableText(formData.get("fundId")),
    splitMode: formData.get("splitMode"),
    participantIds: readJson(formData.get("participantIds"), []),
    customAmounts: readJson(formData.get("customAmounts"), {}),
    note: formData.get("note"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const { supabase } = await requireFinanceUser();
  if (!isFinanceCategoryAllowed(result.data.roomType, result.data.category)) {
    return { error: "หมวดค่าใช้จ่ายไม่ตรงกับประเภทห้อง" };
  }
  if (!(await validateFinanceRoomType(supabase, result.data.roomId, [result.data.roomType]))) {
    return { error: "ประเภทห้องไม่ตรงกับข้อมูลที่ส่งมา" };
  }
  const membersAreValid = await validateFinanceMembers(supabase, result.data.roomId, [
    result.data.paidBy,
    ...result.data.participantIds,
  ]);
  if (!membersAreValid) return { error: "ผู้จ่ายและผู้ร่วมจ่ายต้องเป็นสมาชิกในห้อง" };
  const { error } = await supabase.rpc("save_finance_expense", {
    p_expense_id: result.data.expenseId,
    p_room_id: result.data.roomId,
    p_title: result.data.title,
    p_amount_cents: result.data.amountCents,
    p_expense_date: result.data.expenseDate,
    p_paid_by: result.data.paidBy,
    p_category: result.data.category,
    p_trip_id: result.data.tripId,
    p_fund_id: result.data.fundId,
    p_note: result.data.note,
    p_splits: buildSplits(result.data) as unknown as Json,
  });
  if (error) return { error: `แก้ไขค่าใช้จ่ายไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** ลบค่าใช้จ่ายหลังตรวจผู้สร้างหรือบทบาทเจ้าของห้องซ้ำใน Server Action */
export async function deleteFinanceExpense(formData: FormData): Promise<FinanceActionState> {
  const result = deleteFinanceExpenseSchema.safeParse({
    expenseId: formData.get("expenseId"),
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
  });
  if (!result.success) return { error: "ข้อมูลรายการไม่ถูกต้อง" };

  const { supabase, userId } = await requireFinanceUser();
  const [expenseResult, memberResult] = await Promise.all([
    supabase.from("finance_expenses").select("created_by").eq("id", result.data.expenseId).eq("room_id", result.data.roomId).maybeSingle(),
    supabase.from("room_members").select("role").eq("room_id", result.data.roomId).eq("user_id", userId).maybeSingle(),
  ]);
  if (expenseResult.data?.created_by !== userId && memberResult.data?.role !== "owner") {
    return { error: "คุณไม่มีสิทธิ์ลบรายการนี้" };
  }
  const { error } = await supabase.from("finance_expenses").delete().eq("id", result.data.expenseId).eq("room_id", result.data.roomId);
  if (error) return { error: `ลบค่าใช้จ่ายไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** สร้างทริปสำหรับห้องเพื่อนเพื่อให้ค่าใช้จ่ายหลายรายการรวมอยู่ในบริบทเดียวกัน */
export async function createFinanceTrip(formData: FormData): Promise<FinanceActionState> {
  const result = createFinanceTripSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    name: formData.get("name"),
    startDate: nullableText(formData.get("startDate")),
    endDate: nullableText(formData.get("endDate")),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "ข้อมูลทริปไม่ถูกต้อง" };

  const { supabase, userId } = await requireFinanceUser();
  if (!(await validateFinanceRoomType(supabase, result.data.roomId, ["friend"]))) {
    return { error: "ทริปใช้ได้เฉพาะห้องกลุ่มเพื่อน" };
  }
  const { error } = await supabase.from("finance_trips").insert({
    room_id: result.data.roomId,
    name: result.data.name,
    start_date: result.data.startDate,
    end_date: result.data.endDate,
    created_by: userId,
  });
  if (error) return { error: `สร้างทริปไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** สร้างกองกลางสำหรับทริปของเพื่อนหรือเดตของคู่รัก */
export async function createFinanceFund(formData: FormData): Promise<FinanceActionState> {
  const result = createFinanceFundSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    name: formData.get("name"),
    purpose: formData.get("purpose"),
    target: formData.get("target"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "ข้อมูลกองกลางไม่ถูกต้อง" };

  const { supabase, userId } = await requireFinanceUser();
  const allowedType = result.data.purpose === "trip" ? "friend" : "couple";
  if (!(await validateFinanceRoomType(supabase, result.data.roomId, [allowedType]))) {
    return { error: "ประเภทกองกลางไม่ตรงกับประเภทห้อง" };
  }
  const { error } = await supabase.from("finance_funds").insert({
    room_id: result.data.roomId,
    name: result.data.name,
    purpose: result.data.purpose,
    target_cents: result.data.targetCents,
    created_by: userId,
  });
  if (error) return { error: `สร้างกองกลางไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** เพิ่มเงินเข้ากองกลางในนามของผู้ใช้ปัจจุบัน */
export async function createFundContribution(formData: FormData): Promise<FinanceActionState> {
  const result = createFundContributionSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    fundId: formData.get("fundId"),
    amount: formData.get("amount"),
    contributionDate: formData.get("contributionDate"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "ข้อมูลเงินสมทบไม่ถูกต้อง" };

  const { supabase, userId } = await requireFinanceUser();
  const { data: fund } = await supabase.from("finance_funds").select("room_id").eq("id", result.data.fundId).maybeSingle();
  if (fund?.room_id !== result.data.roomId) return { error: "ไม่พบกองกลางในห้องนี้" };
  const { error } = await supabase.from("finance_fund_contributions").insert({
    fund_id: result.data.fundId,
    user_id: userId,
    amount_cents: result.data.amountCents,
    contribution_date: result.data.contributionDate,
    created_by: userId,
  });
  if (error) return { error: `เพิ่มเงินเข้ากองกลางไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** เพิ่มรายรับรายเดือนของสมาชิกสำหรับห้องครอบครัว */
export async function createFinanceIncome(formData: FormData): Promise<FinanceActionState> {
  const result = createFinanceIncomeSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    userId: formData.get("userId"),
    source: formData.get("source"),
    amount: formData.get("amount"),
    incomeMonth: formData.get("incomeMonth"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "ข้อมูลรายรับไม่ถูกต้อง" };

  const { supabase, userId } = await requireFinanceUser();
  if (!(await validateFinanceRoomType(supabase, result.data.roomId, ["family"]))) {
    return { error: "รายรับรายเดือนใช้ได้เฉพาะห้องครอบครัว" };
  }
  if (!(await validateFinanceMembers(supabase, result.data.roomId, [result.data.userId]))) {
    return { error: "เจ้าของรายรับต้องเป็นสมาชิกในห้อง" };
  }
  const { error } = await supabase.from("finance_incomes").insert({
    room_id: result.data.roomId,
    user_id: result.data.userId,
    source: result.data.source,
    amount_cents: result.data.amountCents,
    income_month: result.data.incomeMonthDate,
    created_by: userId,
  });
  if (error) return { error: `เพิ่มรายรับไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** สร้างหรือแก้ไขงบรายหมวดของเดือนเดียวกันสำหรับห้องครอบครัว */
export async function upsertFinanceBudget(formData: FormData): Promise<FinanceActionState> {
  const result = upsertFinanceBudgetSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    budgetMonth: formData.get("budgetMonth"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "ข้อมูลงบประมาณไม่ถูกต้อง" };

  const { supabase, userId } = await requireFinanceUser();
  if (!(await validateFinanceRoomType(supabase, result.data.roomId, ["family"]))) {
    return { error: "งบประมาณใช้ได้เฉพาะห้องครอบครัว" };
  }
  if (!isFinanceCategoryAllowed("family", result.data.category)) {
    return { error: "หมวดงบประมาณไม่ถูกต้อง" };
  }
  const { error } = await supabase.from("finance_budgets").upsert({
    room_id: result.data.roomId,
    category: result.data.category,
    budget_month: result.data.budgetMonthDate,
    limit_cents: result.data.limitCents,
    created_by: userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "room_id,category,budget_month" });
  if (error) return { error: `บันทึกงบประมาณไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}

/** บันทึกการคืนเงินจริงระหว่างสมาชิกในห้องเพื่อน */
export async function createFinanceRepayment(formData: FormData): Promise<FinanceActionState> {
  const result = createFinanceRepaymentSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    fromUserId: formData.get("fromUserId"),
    toUserId: formData.get("toUserId"),
    amount: formData.get("amount"),
    repaidAt: formData.get("repaidAt"),
  });
  if (!result.success) return { error: result.error.issues[0]?.message ?? "ข้อมูลการคืนเงินไม่ถูกต้อง" };

  const { supabase, userId } = await requireFinanceUser();
  if (!(await validateFinanceRoomType(supabase, result.data.roomId, ["friend"]))) {
    return { error: "การคืนเงินแบบทริปใช้ได้เฉพาะห้องกลุ่มเพื่อน" };
  }
  if (!(await validateFinanceMembers(supabase, result.data.roomId, [result.data.fromUserId, result.data.toUserId]))) {
    return { error: "ผู้คืนและผู้รับเงินต้องเป็นสมาชิกในห้อง" };
  }
  const { error } = await supabase.from("finance_repayments").insert({
    room_id: result.data.roomId,
    from_user_id: result.data.fromUserId,
    to_user_id: result.data.toUserId,
    amount_cents: result.data.amountCents,
    repaid_at: result.data.repaidAt,
    created_by: userId,
  });
  if (error) return { error: `บันทึกการคืนเงินไม่สำเร็จ: ${error.message}` };
  revalidateFinance(result.data.roomCode);
  return { success: true };
}
