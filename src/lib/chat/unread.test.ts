import assert from "node:assert/strict";
import test from "node:test";

import { countNewUnreadMessages } from "./unread.ts";

const seenIds = new Set(["old-message"]);

test("นับเฉพาะข้อความใหม่จากคนอื่นเป็น unread", () => {
  const count = countNewUnreadMessages({
    currentUserId: "me",
    messages: [
      { id: "old-message", userId: "friend" },
      { id: "my-new-message", userId: "me" },
      { id: "friend-new-message", userId: "friend" },
    ],
    seenIds,
  });

  assert.equal(count, 1);
});

test("ไม่นับข้อความเดิมซ้ำเมื่อ sync มาจาก realtime และ polling", () => {
  const count = countNewUnreadMessages({
    currentUserId: "me",
    messages: [
      { id: "old-message", userId: "friend" },
      { id: "old-message", userId: "friend" },
    ],
    seenIds,
  });

  assert.equal(count, 0);
});
