import assert from "node:assert/strict";
import test from "node:test";

import { clampCropOffset, getDraggedCropOffset } from "./crop-position.ts";

test("จำกัดตำแหน่งครอปให้อยู่ในช่วง -100 ถึง 100", () => {
  assert.equal(clampCropOffset(125), 100);
  assert.equal(clampCropOffset(-140), -100);
  assert.equal(clampCropOffset(24), 24);
});

test("แปลงระยะลากเป็นตำแหน่งครอปตามขนาดกรอบ", () => {
  assert.equal(
    getDraggedCropOffset({
      delta: 50,
      frameSize: 400,
      startOffset: 10,
    }),
    35,
  );
});

test("ไม่เปลี่ยนตำแหน่งเมื่อกรอบไม่มีขนาด", () => {
  assert.equal(
    getDraggedCropOffset({
      delta: 80,
      frameSize: 0,
      startOffset: -20,
    }),
    -20,
  );
});
