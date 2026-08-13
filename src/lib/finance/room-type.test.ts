import assert from "node:assert/strict";
import test from "node:test";

import { getFinanceRoomConfig, isFinanceCategoryAllowed } from "./room-type.ts";

test("ห้องเพื่อนมีทริป กองกลาง และการคืนเงิน แต่ไม่มีรายรับครอบครัว", () => {
  const config = getFinanceRoomConfig("friend");
  assert.equal(config.supportsTrips, true);
  assert.equal(config.supportsFunds, true);
  assert.equal(config.supportsRepayments, true);
  assert.equal(config.supportsIncome, false);
});

test("ห้องครอบครัวรองรับรายรับและงบประมาณ", () => {
  const config = getFinanceRoomConfig("family");
  assert.equal(config.supportsIncome, true);
  assert.equal(config.supportsBudgets, true);
  assert.equal(isFinanceCategoryAllowed("family", "สุขภาพ"), true);
  assert.equal(isFinanceCategoryAllowed("couple", "สุขภาพ"), false);
});

test("แต่ละประเภทมีข้อความและหมวดค่าใช้จ่ายเฉพาะของตัวเอง", () => {
  const friend = getFinanceRoomConfig("friend");
  const couple = getFinanceRoomConfig("couple");
  const family = getFinanceRoomConfig("family");
  assert.notEqual(friend.title, couple.title);
  assert.notDeepEqual(friend.categories, couple.categories);
  assert.notDeepEqual(couple.categories, family.categories);
});
