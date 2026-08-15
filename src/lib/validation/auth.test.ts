import assert from "node:assert/strict";
import test from "node:test";

import { updateProfileSchema } from "./auth";

test("จำกัดชื่อที่แสดงไม่เกิน 40 ตัวอักษร", () => {
  const result = updateProfileSchema.safeParse({
    displayName: "ก".repeat(41),
    username: "member_01",
    avatarUrl: "",
  });

  assert.equal(result.success, false);
});

test("อนุญาตชื่อที่แสดงยาวไม่เกิน 40 ตัวอักษร", () => {
  const result = updateProfileSchema.safeParse({
    displayName: "ก".repeat(40),
    username: "member_01",
    avatarUrl: "",
  });

  assert.equal(result.success, true);
});
