import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_IMAGE_URLS,
  IMAGE_UPLOAD_BUCKETS,
  createImageObjectPath,
  getDefaultImageUrl,
  getStorageObjectFromPublicUrl,
} from "./image-upload.ts";

test("แยก bucket รูปตามที่มาของรูป", () => {
  assert.equal(
    IMAGE_UPLOAD_BUCKETS.profile,
    "togetherspace-profile-images",
  );
  assert.equal(IMAGE_UPLOAD_BUCKETS.room, "togetherspace-room-images");
  assert.equal(
    IMAGE_UPLOAD_BUCKETS.roomProfile,
    "togetherspace-room-images",
  );
  assert.equal(IMAGE_UPLOAD_BUCKETS.album, "togetherspace-album-images");
});

test("สร้าง path รูปโปรไฟล์ที่ผูกกับ user ปัจจุบัน", () => {
  assert.equal(
    createImageObjectPath({
      kind: "profile",
      userId: "user-1",
      timestamp: 123,
    }),
    "user-1/profile-123.webp",
  );
});

test("สร้าง path รูปห้องที่ยังไม่สร้างห้องโดยเก็บใต้ draft ของ user", () => {
  assert.equal(
    createImageObjectPath({
      kind: "room",
      userId: "user-1",
      timestamp: 456,
    }),
    "user-1/room-draft-456.webp",
  );
});

test("สร้าง path รูปโปรไฟล์เฉพาะห้องโดยมี room id ใน path", () => {
  assert.equal(
    createImageObjectPath({
      kind: "roomProfile",
      roomId: "room-1",
      userId: "user-1",
      timestamp: 789,
    }),
    "user-1/room-profiles/room-1-789.webp",
  );
});

test("สร้าง path รูปอัลบั้มโดยแยกตาม user และห้อง", () => {
  assert.equal(
    createImageObjectPath({
      kind: "album",
      roomId: "room-1",
      userId: "user-1",
      timestamp: 111,
    }),
    "user-1/albums/room-1/111.webp",
  );
});

test("คืน default image ตามชนิดพื้นที่ที่ต้องใช้รูป", () => {
  assert.equal(getDefaultImageUrl("profile"), DEFAULT_IMAGE_URLS.profile);
  assert.equal(getDefaultImageUrl("roomProfile"), DEFAULT_IMAGE_URLS.profile);
  assert.equal(getDefaultImageUrl("room"), DEFAULT_IMAGE_URLS.room);
});

test("แยก bucket และ path จาก public URL ของ Supabase storage ได้", () => {
  assert.deepEqual(
    getStorageObjectFromPublicUrl(
      "https://demo.supabase.co/storage/v1/object/public/togetherspace-profile-images/user-1/profile-123.webp",
    ),
    {
      bucket: "togetherspace-profile-images",
      path: "user-1/profile-123.webp",
    },
  );
  assert.deepEqual(
    getStorageObjectFromPublicUrl(
      "https://demo.supabase.co/storage/v1/object/public/togetherspace-album-images/user-1/albums/room-1/111.webp",
    ),
    {
      bucket: "togetherspace-album-images",
      path: "user-1/albums/room-1/111.webp",
    },
  );
});

test("ไม่พยายามลบ URL ที่ไม่ใช่ bucket รูปของ TogetherSpace", () => {
  assert.equal(
    getStorageObjectFromPublicUrl("https://example.com/avatar.png"),
    null,
  );
  assert.equal(getStorageObjectFromPublicUrl(DEFAULT_IMAGE_URLS.profile), null);
});
