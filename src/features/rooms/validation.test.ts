import assert from "node:assert/strict";
import test from "node:test";

import { updateRoomDetailsSchema } from "./validation.ts";

const ROOM_ID = "11111111-1111-4111-8111-111111111111";

test("แก้ชื่อและรูปห้องโดยไม่รับการเปลี่ยนประเภท", () => {
  const result = updateRoomDetailsSchema.safeParse({
    roomId: ROOM_ID,
    roomCode: "123456",
    name: "บ้านของเรา",
    avatarUrl: "",
    type: "family",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.avatarUrl, null);
    assert.equal("type" in result.data, false);
  }
});

test("ชื่อห้องต้องไม่ว่างและยาวไม่เกิน 80 ตัวอักษร", () => {
  assert.equal(
    updateRoomDetailsSchema.safeParse({
      roomId: ROOM_ID,
      roomCode: "123456",
      name: "   ",
      avatarUrl: "",
    }).success,
    false,
  );
});
