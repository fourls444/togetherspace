import assert from "node:assert/strict";
import test from "node:test";

import { createFinanceExpenseSchema } from "./validation.ts";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

test("แปลงจำนวนเงินบาทเป็นสตางค์และยอมรับการแบ่งเท่ากัน", () => {
  const result = createFinanceExpenseSchema.safeParse({
    roomId: "33333333-3333-4333-8333-333333333333",
    roomCode: "123456",
    roomType: "friend",
    title: "มื้อเย็น",
    amount: "120.50",
    expenseDate: "2026-08-13",
    paidBy: userA,
    category: "อาหารและเครื่องดื่ม",
    tripId: null,
    fundId: null,
    splitMode: "equal",
    participantIds: [userA, userB],
    customAmounts: {},
    note: "",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.amountCents, 12050);
    assert.equal(result.data.note, null);
  }
});

test("ปฏิเสธยอดแบ่งเองที่รวมไม่เท่ากับยอดค่าใช้จ่าย", () => {
  const result = createFinanceExpenseSchema.safeParse({
    roomId: "33333333-3333-4333-8333-333333333333",
    roomCode: "123456",
    roomType: "friend",
    title: "ค่าเดินทาง",
    amount: "100",
    expenseDate: "2026-08-13",
    paidBy: userA,
    category: "เดินทาง",
    tripId: null,
    fundId: null,
    splitMode: "custom",
    participantIds: [userA, userB],
    customAmounts: { [userA]: "60", [userB]: "30" },
    note: "",
  });

  assert.equal(result.success, false);
});

test("ปฏิเสธยอดแบ่งเองที่ว่างหรือเป็นศูนย์แม้ยอดอื่นรวมครบ", () => {
  const result = createFinanceExpenseSchema.safeParse({
    roomId: "33333333-3333-4333-8333-333333333333",
    roomCode: "123456",
    roomType: "friend",
    title: "ค่าเดินทาง",
    amount: "100",
    expenseDate: "2026-08-13",
    paidBy: userA,
    category: "เดินทาง",
    tripId: null,
    fundId: null,
    splitMode: "custom",
    participantIds: [userA, userB],
    customAmounts: { [userA]: "100", [userB]: "0" },
    note: "",
  });

  assert.equal(result.success, false);
});
