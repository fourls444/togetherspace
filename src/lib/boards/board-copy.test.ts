import assert from "node:assert/strict";
import test from "node:test";

import { getBoardCopy } from "./board-copy.ts";

test("คืนข้อความบอร์ดของคู่รักพร้อมคำแนะนำ 3 แบบ", () => {
  const copy = getBoardCopy("couple");

  assert.equal(copy.pageTitle, "บอร์ดของเรา");
  assert.equal(copy.actions.note.label, "ความคิด");
  assert.match(copy.empty.description, /สองคน/);
  assert.equal(copy.starterSuggestions.length, 3);
});

test("คืนข้อความบอร์ดของครอบครัวที่เน้นงานบ้านและเรื่องที่ต้องรู้ร่วมกัน", () => {
  const copy = getBoardCopy("family");

  assert.equal(copy.pageTitle, "บอร์ดของบ้าน");
  assert.equal(copy.actions.checklist.label, "งานที่ต้องช่วยกัน");
  assert.match(copy.placeholders.checklistItems, /ซื้อของเข้าบ้าน/);
  assert.equal(copy.starterSuggestions.length, 3);
});

test("คืนข้อความบอร์ดของกลุ่มเพื่อนที่ต่างจากครอบครัวและคู่รัก", () => {
  const friend = getBoardCopy("friend");
  const family = getBoardCopy("family");
  const couple = getBoardCopy("couple");

  assert.equal(friend.pageTitle, "บอร์ด");
  assert.equal(friend.actions.poll.label, "โหวตแผน");
  assert.equal(friend.actions.checklist.label, "เช็คลิสต์");
  assert.doesNotMatch(JSON.stringify(friend), /แก๊ง/);
  assert.notEqual(friend.lead, family.lead);
  assert.notEqual(friend.lead, couple.lead);
});
