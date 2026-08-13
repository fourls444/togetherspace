import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_TOAST_DURATION } from "./toast-timing.ts";

test("ข้อความแจ้งผลใช้เวลาแสดง 2.5 วินาทีเป็นค่าเริ่มต้น", () => {
  assert.equal(DEFAULT_TOAST_DURATION, 2500);
});
