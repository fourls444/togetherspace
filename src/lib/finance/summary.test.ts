import assert from "node:assert/strict";
import test from "node:test";

import { calculateFinanceSummary } from "./summary.ts";

test("สรุปหนี้แบบง่ายเมื่อมีผู้จ่ายคนเดียว", () => {
  const result = calculateFinanceSummary([
    {
      amountCents: 30000,
      paidBy: "a",
      splits: [
        { userId: "a", amountCents: 10000 },
        { userId: "b", amountCents: 10000 },
        { userId: "c", amountCents: 10000 },
      ],
    },
  ]);

  assert.equal(result.totalCents, 30000);
  assert.deepEqual(result.settlements, [
    { fromUserId: "b", toUserId: "a", amountCents: 10000 },
    { fromUserId: "c", toUserId: "a", amountCents: 10000 },
  ]);
});

test("หักล้างหลายรายการก่อนสร้างรายการจ่ายคืน", () => {
  const result = calculateFinanceSummary([
    {
      amountCents: 10000,
      paidBy: "a",
      splits: [
        { userId: "a", amountCents: 5000 },
        { userId: "b", amountCents: 5000 },
      ],
    },
    {
      amountCents: 4000,
      paidBy: "b",
      splits: [
        { userId: "a", amountCents: 2000 },
        { userId: "b", amountCents: 2000 },
      ],
    },
  ]);

  assert.deepEqual(result.settlements, [
    { fromUserId: "b", toUserId: "a", amountCents: 3000 },
  ]);
});

test("หักยอดที่สมาชิกคืนแล้วออกจากยอดค้าง", () => {
  const result = calculateFinanceSummary(
    [{
      amountCents: 10000,
      paidBy: "a",
      splits: [
        { userId: "a", amountCents: 5000 },
        { userId: "b", amountCents: 5000 },
      ],
    }],
    [{ fromUserId: "b", toUserId: "a", amountCents: 3000 }],
  );

  assert.deepEqual(result.settlements, [
    { fromUserId: "b", toUserId: "a", amountCents: 2000 },
  ]);
});
