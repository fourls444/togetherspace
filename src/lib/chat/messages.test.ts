import assert from "node:assert/strict";
import { test } from "node:test";

import { mergeRoomChatMessages, type ChatMessageIdentity } from "./messages.ts";

const first: ChatMessageIdentity = { id: "a", createdAt: "2026-08-13T10:00:00Z" };
const second: ChatMessageIdentity = { id: "b", createdAt: "2026-08-13T10:01:00Z" };

test("รวมข้อความโดยไม่ให้ id เดิมซ้ำ", () => {
  assert.deepEqual(mergeRoomChatMessages([first], [first, second]), [
    first,
    second,
  ]);
});

test("เรียงข้อความจากเก่าไปใหม่หลังรวม", () => {
  assert.deepEqual(mergeRoomChatMessages([second], [first]), [first, second]);
});
