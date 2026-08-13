import assert from "node:assert/strict";
import { test } from "node:test";

import { sendRoomMessageSchema } from "./validation.ts";

test("ตัดช่องว่างข้อความก่อนตรวจและส่งค่าที่สะอาดกลับมา", () => {
  const result = sendRoomMessageSchema.parse({
    body: "  สวัสดีทุกคน  ",
    roomCode: "123456",
    roomId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(result.body, "สวัสดีทุกคน");
});

test("ไม่รับข้อความว่าง", () => {
  const result = sendRoomMessageSchema.safeParse({
    body: "   ",
    roomCode: "123456",
    roomId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(result.success, false);
});
