import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldSubmitRoomChat } from "./keyboard.ts";

test("กด Enter ธรรมดาให้ส่งข้อความ", () => {
  assert.equal(
    shouldSubmitRoomChat({ isComposing: false, key: "Enter", shiftKey: false }),
    true,
  );
});

test("กด Shift Enter ให้เว้นบรรทัดแทนการส่ง", () => {
  assert.equal(
    shouldSubmitRoomChat({ isComposing: false, key: "Enter", shiftKey: true }),
    false,
  );
});

test("ตอนกำลังพิมพ์ด้วย IME ไม่ส่งข้อความพลาด", () => {
  assert.equal(
    shouldSubmitRoomChat({ isComposing: true, key: "Enter", shiftKey: false }),
    false,
  );
});
