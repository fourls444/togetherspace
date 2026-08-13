import { z } from "zod";

const moneyTextSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "กรุณากรอกจำนวนเงินให้ถูกต้อง")
  .refine((value) => Number(value) > 0, "จำนวนเงินต้องมากกว่า 0");

const financeExpenseBaseSchema = z
  .object({
    roomId: z.string().uuid(),
    roomCode: z.string().regex(/^\d{6}$/),
    roomType: z.enum(["friend", "couple", "family"]),
    title: z.string().trim().min(1, "กรุณากรอกชื่อรายการ").max(120),
    amount: moneyTextSchema,
    expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    paidBy: z.string().uuid(),
    category: z.string().trim().min(1, "กรุณาเลือกหมวดค่าใช้จ่าย").max(80),
    tripId: z.string().uuid().nullable(),
    fundId: z.string().uuid().nullable(),
    splitMode: z.enum(["equal", "custom"]),
    participantIds: z.array(z.string().uuid()).min(1, "เลือกผู้ร่วมจ่ายอย่างน้อย 1 คน"),
    customAmounts: z.record(z.string(), z.string()).default({}),
    note: z.string().trim().max(1000).transform((value) => value || null),
  })
  .superRefine((value, context) => {
    if (value.splitMode !== "custom") return;

    const totalCents = moneyToCents(value.amount);
    const hasInvalidAmount = value.participantIds.some((userId) => {
      const amount = value.customAmounts[userId];
      return !amount || !moneyTextSchema.safeParse(amount).success;
    });

    if (hasInvalidAmount) {
      context.addIssue({
        code: "custom",
        message: "กรุณากรอกยอดของผู้ร่วมจ่ายทุกคนให้มากกว่า 0",
        path: ["customAmounts"],
      });
      return;
    }

    const splitTotalCents = value.participantIds.reduce((total, userId) => {
      const amount = value.customAmounts[userId];
      return total + moneyToCents(amount);
    }, 0);

    if (splitTotalCents !== totalCents) {
      context.addIssue({
        code: "custom",
        message: "ยอดแบ่งของสมาชิกต้องรวมเท่ากับยอดค่าใช้จ่าย",
        path: ["customAmounts"],
      });
    }
  });

/** แปลงจำนวนเงินบาทจากช่องกรอกเป็นจำนวนเต็มหน่วยสตางค์ */
export function moneyToCents(value: string): number {
  return Math.round(Number(value) * 100);
}

/** แบ่งจำนวนสตางค์เท่ากัน โดยกระจายเศษทีละหนึ่งสตางค์ตามลำดับสมาชิก */
export function splitEqually(totalCents: number, userIds: string[]) {
  const base = Math.floor(totalCents / userIds.length);
  const remainder = totalCents % userIds.length;

  return userIds.map((userId, index) => ({
    userId,
    amountCents: base + (index < remainder ? 1 : 0),
  }));
}

export const createFinanceExpenseSchema = financeExpenseBaseSchema.transform(
  (value) => ({
    ...value,
    amountCents: moneyToCents(value.amount),
  }),
);

export const updateFinanceExpenseSchema = financeExpenseBaseSchema
  .and(z.object({ expenseId: z.string().uuid() }))
  .transform((value) => ({
    ...value,
    amountCents: moneyToCents(value.amount),
  }));

export const deleteFinanceExpenseSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  expenseId: z.string().uuid(),
});

const financeRoomBaseSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
});

export const createFinanceTripSchema = financeRoomBaseSchema.extend({
  name: z.string().trim().min(1, "กรุณากรอกชื่อทริป").max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
}).superRefine((value, context) => {
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    context.addIssue({ code: "custom", message: "วันสิ้นสุดต้องไม่มาก่อนวันเริ่ม", path: ["endDate"] });
  }
});

export const createFinanceFundSchema = financeRoomBaseSchema.extend({
  name: z.string().trim().min(1, "กรุณากรอกชื่อกองกลาง").max(120),
  purpose: z.enum(["trip", "date"]),
  target: z.union([moneyTextSchema, z.literal("")]),
}).transform((value) => ({
  ...value,
  targetCents: value.target ? moneyToCents(value.target) : null,
}));

export const createFundContributionSchema = financeRoomBaseSchema.extend({
  fundId: z.string().uuid(),
  amount: moneyTextSchema,
  contributionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).transform((value) => ({ ...value, amountCents: moneyToCents(value.amount) }));

export const createFinanceIncomeSchema = financeRoomBaseSchema.extend({
  userId: z.string().uuid(),
  source: z.string().trim().min(1, "กรุณากรอกแหล่งรายรับ").max(120),
  amount: moneyTextSchema,
  incomeMonth: z.string().regex(/^\d{4}-\d{2}$/),
}).transform((value) => ({
  ...value,
  amountCents: moneyToCents(value.amount),
  incomeMonthDate: `${value.incomeMonth}-01`,
}));

export const upsertFinanceBudgetSchema = financeRoomBaseSchema.extend({
  category: z.string().trim().min(1).max(80),
  amount: moneyTextSchema,
  budgetMonth: z.string().regex(/^\d{4}-\d{2}$/),
}).transform((value) => ({
  ...value,
  limitCents: moneyToCents(value.amount),
  budgetMonthDate: `${value.budgetMonth}-01`,
}));

export const createFinanceRepaymentSchema = financeRoomBaseSchema.extend({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: moneyTextSchema,
  repaidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((value) => value.fromUserId !== value.toUserId, {
  message: "ผู้คืนเงินและผู้รับเงินต้องเป็นคนละคน",
  path: ["toUserId"],
}).transform((value) => ({ ...value, amountCents: moneyToCents(value.amount) }));

export type CreateFinanceExpenseInput = z.infer<typeof createFinanceExpenseSchema>;
export type UpdateFinanceExpenseInput = z.infer<typeof updateFinanceExpenseSchema>;
