import type { RoomRole } from "@/lib/types/database";

export type MemberPermissionItem = {
  userId: string;
  role: RoomRole;
};

/** ตรวจสิทธิ์ว่าผู้ใช้เป็น Owner ในรายการสมาชิกของห้องหรือไม่ */
export function isOwner(
  members: MemberPermissionItem[],
  userId: string,
): boolean {
  return members.some(
    (member) => member.userId === userId && member.role === "owner",
  );
}

/** ตรวจสิทธิ์ว่าผู้ใช้เป็นสมาชิกของห้องหรือไม่ */
export function isMember(
  members: MemberPermissionItem[],
  userId: string,
): boolean {
  return members.some((member) => member.userId === userId);
}
