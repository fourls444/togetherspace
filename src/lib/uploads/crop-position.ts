/** จำกัดตำแหน่งภาพไม่ให้ลากเลยพื้นที่ครอปที่ระบบรองรับ */
export function clampCropOffset(value: number) {
  return Math.min(100, Math.max(-100, value));
}

/** แปลงระยะลากบนหน้าจอเป็นตำแหน่งครอปแบบร้อยละ */
export function getDraggedCropOffset({
  delta,
  frameSize,
  startOffset,
}: {
  delta: number;
  frameSize: number;
  startOffset: number;
}) {
  if (frameSize <= 0) return clampCropOffset(startOffset);
  return clampCropOffset(startOffset + (delta / frameSize) * 200);
}
