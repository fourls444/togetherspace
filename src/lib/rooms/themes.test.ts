import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_ROOM_THEME_ID,
  getRoomThemes,
  resolveRoomTheme,
} from "./themes.ts";

test("ทุกประเภทห้องใช้ธีม TogetherSpace เป็นค่าเริ่มต้น", () => {
  for (const type of ["couple", "family", "friend"] as const) {
    assert.equal(getRoomThemes(type)[0]?.id, DEFAULT_ROOM_THEME_ID);
    assert.equal(getRoomThemes(type)[1]?.id, "warm-light");
    assert.equal(getRoomThemes(type).length, 4);
  }
});

test("ห้องเห็นเฉพาะธีมของประเภทตัวเอง", () => {
  const coupleThemeIds = getRoomThemes("couple").map((theme) => theme.id);
  const familyThemeIds = getRoomThemes("family").map((theme) => theme.id);
  const friendThemeIds = getRoomThemes("friend").map((theme) => theme.id);

  assert.ok(coupleThemeIds.includes("rose-evening"));
  assert.ok(coupleThemeIds.includes("blush-morning"));
  assert.ok(!coupleThemeIds.includes("calm-home"));
  assert.ok(familyThemeIds.includes("calm-home"));
  assert.ok(familyThemeIds.includes("sunny-home"));
  assert.ok(!familyThemeIds.includes("midnight-crew"));
  assert.ok(friendThemeIds.includes("midnight-crew"));
  assert.ok(friendThemeIds.includes("day-trip"));
  assert.ok(!friendThemeIds.includes("rose-evening"));
});

test("ธีมที่ไม่ตรงกับประเภทห้องกลับไปใช้ธีมเริ่มต้น", () => {
  assert.equal(
    resolveRoomTheme("family", "rose-evening").id,
    DEFAULT_ROOM_THEME_ID,
  );
  assert.equal(resolveRoomTheme("friend", null).id, DEFAULT_ROOM_THEME_ID);
});
