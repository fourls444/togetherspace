import assert from "node:assert/strict";
import test from "node:test";

import {
  getNextMemberLimit,
  getVisibleMembers,
} from "./member-visibility.ts";

const members = Array.from({ length: 45 }, (_, index) => ({
  id: String(index + 1),
}));

test("แสดงสมาชิกเริ่มต้นไม่เกิน 20 คน", () => {
  assert.equal(getVisibleMembers(members, 20).length, 20);
});

test("โหลดสมาชิกเพิ่มครั้งละ 20 คนโดยไม่เกินจำนวนทั้งหมด", () => {
  assert.equal(getNextMemberLimit(20, 45), 40);
  assert.equal(getNextMemberLimit(40, 45), 45);
});
