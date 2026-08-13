import assert from "node:assert/strict";
import test from "node:test";

import { parseBoardBody } from "./board-body.ts";

test("แปลงข้อความที่ขึ้นต้นด้วยขีดเป็น bullet list", () => {
  assert.deepEqual(parseBoardBody("- ร้านอาหาร\n- คาเฟ่"), [
    { items: ["ร้านอาหาร", "คาเฟ่"], type: "ul" },
  ]);
});

test("แปลงข้อความที่ขึ้นต้นด้วยเลขเป็น ordered list", () => {
  assert.deepEqual(parseBoardBody("1. จองร้าน\n2. นัดเวลา"), [
    { items: ["จองร้าน", "นัดเวลา"], type: "ol" },
  ]);
});

test("เก็บย่อหน้าปกติและแยก list คนละชนิด", () => {
  assert.deepEqual(parseBoardBody("ไอเดีย\n- หนึ่ง\n1. สอง"), [
    { text: "ไอเดีย", type: "p" },
    { items: ["หนึ่ง"], type: "ul" },
    { items: ["สอง"], type: "ol" },
  ]);
});
