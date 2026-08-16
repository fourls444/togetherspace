import assert from "node:assert/strict";
import test from "node:test";

import {
  cameraDistanceForSpanKm,
  clusterPlaces,
  globeFrameForPlaces,
} from "./place-clusters.ts";

function place(id: string, latitude: number, longitude: number) {
  return {
    creatorAvatarUrl: "/images/defaults/default-profile.png",
    id,
    latitude,
    longitude,
    name: id,
  };
}

test("หมุดในกรุงเทพยุบเป็นกลุ่มเดียว", () => {
  const clusters = clusterPlaces([
    place("a", 13.7563, 100.5018),
    place("b", 13.73, 100.54),
    place("c", 13.81, 100.56),
  ]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0]?.label, "กรุงเทพฯ");
  assert.equal(clusters[0]?.places.length, 3);
});

test("กรุงเทพกับเชียงใหม่แยกกลุ่ม", () => {
  const clusters = clusterPlaces([
    place("bkk", 13.7563, 100.5018),
    place("cnx", 18.7883, 98.9853),
  ]);
  assert.equal(clusters.length, 2);
  const labels = clusters.map((cluster) => cluster.label).sort();
  assert.deepEqual(labels, ["กรุงเทพฯ", "เชียงใหม่"]);
});

test("หมุดโซลได้ชื่อเมือง ไม่ใช่ไทย", () => {
  const clusters = clusterPlaces([place("seoul", 37.5665, 126.978)]);
  assert.equal(clusters[0]?.label, "โซล");
});

test("เฟรมไทยใกล้กว่าเฟรมทั้งโลก", () => {
  assert.ok(cameraDistanceForSpanKm(40) < cameraDistanceForSpanKm(2000));
  const thaiFrame = globeFrameForPlaces([
    place("bkk", 13.7563, 100.5018),
    place("cnx", 18.7883, 98.9853),
  ]);
  assert.ok(thaiFrame.distance < 6.5);
  assert.ok(thaiFrame.distance > 4);
});
