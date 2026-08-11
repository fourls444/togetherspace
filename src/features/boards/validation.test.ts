import assert from "node:assert/strict";
import test from "node:test";

import {
  createChecklistItemSchema,
  createPollOptionSchema,
  deleteChecklistItemSchema,
  deletePollOptionSchema,
  toggleChecklistSchema,
  updatePollSettingsSchema,
} from "./validation.ts";

const ROOM_ID = "11111111-1111-4111-8111-111111111111";
const BOARD_ITEM_ID = "22222222-2222-4222-8222-222222222222";
const CHILD_ID = "33333333-3333-4333-8333-333333333333";

test("รับข้อความ checklist ใหม่หลังตัดช่องว่าง", () => {
  const result = createChecklistItemSchema.safeParse({
    roomId: ROOM_ID,
    boardItemId: BOARD_ITEM_ID,
    text: "  จองร้านอาหาร  ",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.text, "จองร้านอาหาร");
});

test("รับ id ของ checklist ที่ต้องการลบ", () => {
  assert.equal(
    deleteChecklistItemSchema.safeParse({
      roomId: ROOM_ID,
      checklistItemId: CHILD_ID,
    }).success,
    true,
  );
});

test("รับตัวเลือก poll ใหม่และคำสั่งลบตัวเลือก", () => {
  assert.equal(
    createPollOptionSchema.safeParse({
      roomId: ROOM_ID,
      boardItemId: BOARD_ITEM_ID,
      label: "วันเสาร์",
    }).success,
    true,
  );
  assert.equal(
    deletePollOptionSchema.safeParse({
      roomId: ROOM_ID,
      boardItemId: BOARD_ITEM_ID,
      optionId: CHILD_ID,
    }).success,
    true,
  );
});

test("แก้โหมด poll ได้เฉพาะโหวตข้อเดียวหรือหลายข้อ", () => {
  assert.equal(
    updatePollSettingsSchema.safeParse({
      roomId: ROOM_ID,
      boardItemId: BOARD_ITEM_ID,
      pollVoteMode: "multiple",
    }).success,
    true,
  );
  assert.equal(
    updatePollSettingsSchema.safeParse({
      roomId: ROOM_ID,
      boardItemId: BOARD_ITEM_ID,
      pollVoteMode: "three",
    }).success,
    false,
  );
});

test("อ่านสถานะ false ของ checklist เป็น boolean false", () => {
  const result = toggleChecklistSchema.safeParse({
    roomId: ROOM_ID,
    checklistItemId: CHILD_ID,
    isDone: "false",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.isDone, false);
});
