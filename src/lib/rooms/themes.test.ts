import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_ROOM_THEME_ID,
  getRoomSilkMetal,
  getRoomThemes,
  hexToRgbTuple,
  resolveRoomTheme,
} from "./themes.ts";

test("ทุกประเภทห้องใช้สี่ขั้วเดียวกัน และเริ่มที่ TogetherSpace", () => {
  for (const type of ["couple", "family", "friend"] as const) {
    const ids = getRoomThemes(type).map((theme) => theme.id);
    assert.equal(ids[0], DEFAULT_ROOM_THEME_ID);
    assert.deepEqual(ids, [
      DEFAULT_ROOM_THEME_ID,
      "warm-light",
      "rose-evening",
      "calm-home",
    ]);
  }
});

test("ห้องทุกประเภทเลือกธีมชมพูได้", () => {
  for (const type of ["couple", "family", "friend"] as const) {
    assert.equal(resolveRoomTheme(type, "rose-evening").id, "rose-evening");
  }
});

test("ธีมรหัสเก่าถูกโยงไปขั้วใหม่ และค่าว่างกลับไปธีมเริ่มต้น", () => {
  assert.equal(resolveRoomTheme("couple", "blush-morning").id, "rose-evening");
  assert.equal(resolveRoomTheme("friend", "midnight-crew").id, DEFAULT_ROOM_THEME_ID);
  assert.equal(resolveRoomTheme("family", "sunny-home").id, "calm-home");
  assert.equal(resolveRoomTheme("friend", null).id, DEFAULT_ROOM_THEME_ID);
});

test("ไหมของแต่ละขั้วไม่ยืมแชมเปญจากธีมหลัก", () => {
  const paper = resolveRoomTheme("friend", "warm-light");
  const rose = resolveRoomTheme("couple", "rose-evening");
  const moss = resolveRoomTheme("family", "calm-home");
  const atelier = resolveRoomTheme("friend", DEFAULT_ROOM_THEME_ID);
  assert.equal(getRoomSilkMetal(paper), paper.palette.mutedSurface);
  assert.equal(getRoomSilkMetal(rose), rose.palette.primary);
  assert.equal(getRoomSilkMetal(moss), moss.palette.primary);
  assert.equal(getRoomSilkMetal(atelier), atelier.palette.primary);
  assert.notEqual(getRoomSilkMetal(paper), atelier.palette.primary);
  assert.notEqual(getRoomSilkMetal(rose), atelier.palette.primary);
});

test("ธีม Linen ไม่ใช้พื้นขาวจ้า", () => {
  const paper = resolveRoomTheme("friend", "warm-light");
  const [red, green, blue] = hexToRgbTuple(paper.palette.background);
  const [surfaceRed, surfaceGreen, surfaceBlue] = hexToRgbTuple(
    paper.palette.surface,
  );
  assert.ok((red + green + blue) / 3 < 0.72);
  assert.ok((surfaceRed + surfaceGreen + surfaceBlue) / 3 < 0.76);
});
