import test from "node:test";
import assert from "node:assert/strict";

import { getRoomHomeModules } from "./labels.ts";

test("ใช้ชื่อโมดูลกลางเหมือนกันทุกประเภทห้อง", () => {
  for (const roomType of ["friend", "couple", "family"] as const) {
    const titles = new Map(
      getRoomHomeModules(roomType).map((module) => [module.key, module.title]),
    );

    assert.equal(titles.get("board"), "บอร์ด");
    assert.equal(titles.get("album"), "อัลบั้ม");
    assert.equal(titles.get("map"), "แผนที่");
    assert.equal(titles.get("finance"), "การเงิน");
    assert.equal(titles.get("members"), "สมาชิก");
    assert.equal(
      roomType === "friend" ? titles.get("friend-profiles") : undefined,
      roomType === "friend" ? "โปรไฟล์เพื่อน" : undefined,
    );
  }
});
