import assert from "node:assert/strict";
import test from "node:test";

import {
  getAlbumTakenDate,
  normalizeAlbumCaption,
  reorderAlbumPhotoSchema,
  saveAlbumPhotoOrderSchema,
  saveAlbumPhotosSchema,
  updateAlbumPhotoSchema,
} from "./validation.ts";

test("ใช้วันที่อัปโหลดเป็น default เมื่อไม่ได้เลือกวันที่ถ่าย", () => {
  assert.equal(getAlbumTakenDate("", "2026-08-11"), "2026-08-11");
  assert.equal(getAlbumTakenDate(null, "2026-08-11"), "2026-08-11");
  assert.equal(getAlbumTakenDate("2026-01-03", "2026-08-11"), "2026-01-03");
});

test("จัด caption ให้สั้นและว่างแล้วเป็น null", () => {
  assert.equal(normalizeAlbumCaption("  ไปเที่ยวทะเล  "), "ไปเที่ยวทะเล");
  assert.equal(normalizeAlbumCaption("   "), null);
});

test("รับ metadata หลายรูปเพื่อบันทึกอัลบั้ม", () => {
  const result = saveAlbumPhotosSchema.safeParse({
    roomId: "11111111-1111-4111-8111-111111111111",
    roomCode: "123456",
    caption: "",
    takenAt: "",
    photosJson: JSON.stringify([
      {
        imageUrl:
          "https://demo.supabase.co/storage/v1/object/public/togetherspace-album-images/user-1/albums/photo.webp",
        storagePath: "user-1/albums/photo.webp",
      },
    ]),
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.caption, null);
    assert.equal(result.data.photos.length, 1);
  }
});

test("รับคำสั่งเลื่อนลำดับรูปในอัลบั้ม", () => {
  const result = reorderAlbumPhotoSchema.safeParse({
    direction: "up",
    photoId: "11111111-1111-4111-8111-111111111111",
    roomCode: "123456",
    roomId: "22222222-2222-4222-8222-222222222222",
  });

  assert.equal(result.success, true);
});

test("รับลำดับรูปใหม่จาก drag and drop ภายในวันเดียวกัน", () => {
  const result = saveAlbumPhotoOrderSchema.safeParse({
    dateKey: "2026-08-11",
    photoIdsJson: JSON.stringify([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]),
    roomCode: "123456",
    roomId: "33333333-3333-4333-8333-333333333333",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.photoIds, [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]);
  }
});

test("แก้วันที่และคำบรรยายรูปได้", () => {
  const result = updateAlbumPhotoSchema.safeParse({
    roomId: "11111111-1111-4111-8111-111111111111",
    roomCode: "123456",
    photoId: "22222222-2222-4222-8222-222222222222",
    caption: "  ทริปทะเล  ",
    takenAt: "2026-08-11",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.caption, "ทริปทะเล");
});

test("ไม่รับวันที่แก้ไขรูปที่รูปแบบไม่ถูกต้อง", () => {
  const result = updateAlbumPhotoSchema.safeParse({
    roomId: "11111111-1111-4111-8111-111111111111",
    roomCode: "123456",
    photoId: "22222222-2222-4222-8222-222222222222",
    caption: "",
    takenAt: "11/08/2026",
  });

  assert.equal(result.success, false);
});
