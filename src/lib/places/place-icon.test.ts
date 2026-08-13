import assert from "node:assert/strict";
import test from "node:test";

import { getGoogleMapsUrl, getPlaceIconKey } from "./place-icon.ts";

test("เลือกไอคอนจากคำสำคัญในชื่อและรายละเอียดสถานที่", () => {
  assert.equal(getPlaceIconKey("คาเฟ่บ้านข้างคลอง", null), "coffee");
  assert.equal(getPlaceIconKey("วันพักผ่อน", "เดินเล่นในสวน"), "park");
  assert.equal(getPlaceIconKey("ชายหาดบางแสน", null), "beach");
  assert.equal(getPlaceIconKey("ตลาดน้อย", null), "shopping");
});

test("ใช้ไอคอนหมุดเมื่อไม่พบประเภทที่ตรงกัน", () => {
  assert.equal(getPlaceIconKey("สถานที่ของเรา", null), "default");
});

test("สร้างลิงก์ Google Maps จากพิกัดและชื่อสถานที่", () => {
  assert.equal(
    getGoogleMapsUrl(13.7307, 100.5418),
    "https://www.google.com/maps/search/?api=1&query=13.7307%2C100.5418",
  );
});
