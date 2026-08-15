import test from "node:test";
import assert from "node:assert/strict";

import { formatBaht } from "./summary";

test("แสดงจำนวนเงินด้วยคำว่าบาทแทนสัญลักษณ์สกุลเงิน", () => {
  assert.equal(formatBaht(123450), "1,234.50 บาท");
});
