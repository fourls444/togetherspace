export const MEMBER_PAGE_SIZE = 20;

/** คืนสมาชิกตามจำนวนที่ต้องการแสดง โดยไม่แก้ไขลำดับต้นฉบับ */
export function getVisibleMembers<T>(members: T[], visibleLimit: number) {
  return members.slice(0, Math.max(0, visibleLimit));
}

/** เพิ่มขีดจำกัดสมาชิกทีละหน้าและไม่ให้มากกว่าจำนวนสมาชิกทั้งหมด */
export function getNextMemberLimit(
  currentLimit: number,
  totalMembers: number,
  pageSize = MEMBER_PAGE_SIZE,
) {
  return Math.min(totalMembers, currentLimit + pageSize);
}
