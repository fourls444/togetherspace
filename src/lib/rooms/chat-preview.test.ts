import assert from "node:assert/strict";
import test from "node:test";

import { formatRoomChatPreview } from "./chat-preview.ts";

test("ขึ้นต้นข้อความล่าสุดด้วยคำว่าคุณเมื่อเป็นข้อความของผู้ใช้ปัจจุบัน", () => {
  assert.equal(
    formatRoomChatPreview({
      body: "ถึงแล้ว",
      currentUserId: "user-1",
      senderName: "ธนนท์",
      userId: "user-1",
    }),
    "คุณ: ถึงแล้ว",
  );
});

test("ขึ้นต้นข้อความล่าสุดด้วยชื่อผู้ส่งเมื่อเป็นข้อความของสมาชิกคนอื่น", () => {
  assert.equal(
    formatRoomChatPreview({
      body: "เจอกันพรุ่งนี้",
      currentUserId: "user-1",
      senderName: "เพื่อน",
      userId: "user-2",
    }),
    "เพื่อน: เจอกันพรุ่งนี้",
  );
});
