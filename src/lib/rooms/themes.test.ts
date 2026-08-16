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

function channelLuminance(channel: number) {
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(foreground: string, background: string) {
  const [fr, fg, fb] = hexToRgbTuple(foreground);
  const [br, bg, bb] = hexToRgbTuple(background);
  const left =
    0.2126 * channelLuminance(fr) +
    0.7152 * channelLuminance(fg) +
    0.0722 * channelLuminance(fb);
  const right =
    0.2126 * channelLuminance(br) +
    0.7152 * channelLuminance(bg) +
    0.0722 * channelLuminance(bb);
  const lighter = Math.max(left, right);
  const darker = Math.min(left, right);
  return (lighter + 0.05) / (darker + 0.05);
}

test("ตัวหนังสือทุกธีมอ่านได้บนพื้นหลังและการ์ด", () => {
  for (const themeId of [
    DEFAULT_ROOM_THEME_ID,
    "warm-light",
    "rose-evening",
    "calm-home",
  ] as const) {
    const { palette } = resolveRoomTheme("friend", themeId);
    assert.ok(
      contrastRatio(palette.text, palette.background) >= 4.5,
      `${themeId} text on background`,
    );
    assert.ok(
      contrastRatio(palette.text, palette.surface) >= 4.5,
      `${themeId} text on surface`,
    );
    assert.ok(
      contrastRatio(palette.textMuted, palette.background) >= 4.5,
      `${themeId} muted on background`,
    );
    assert.ok(
      contrastRatio(palette.textMuted, palette.surface) >= 4.5,
      `${themeId} muted on surface`,
    );
    assert.ok(
      contrastRatio(palette.placeholder, palette.surface) >= 4.5,
      `${themeId} placeholder on surface`,
    );
    assert.ok(
      contrastRatio(palette.primaryText, palette.primary) >= 4.5,
      `${themeId} primary button`,
    );
  }
});
