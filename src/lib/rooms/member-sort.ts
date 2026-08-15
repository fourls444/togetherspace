import type { RoomRole } from "@/lib/types/database";

export type SortableRoomMember = {
  displayName: string;
  role: RoomRole;
  userId: string;
  username?: string;
};

/** เรียงสมาชิกให้ owner อยู่ก่อน ตามด้วยผู้ใช้ปัจจุบัน แล้วค่อยเรียงคนอื่นตามชื่อ */
export function sortRoomMembers<T extends SortableRoomMember>(
  members: T[],
  currentUserId?: string,
) {
  return [...members].sort((a, b) => {
    const roleScore = (member: SortableRoomMember) =>
      member.role === "owner" ? 0 : 1;
    const selfScore = (member: SortableRoomMember) =>
      currentUserId && member.userId === currentUserId ? 0 : 1;
    const byRole = roleScore(a) - roleScore(b);
    if (byRole !== 0) return byRole;

    const bySelf = selfScore(a) - selfScore(b);
    if (bySelf !== 0) return bySelf;

    return `${a.displayName} ${a.username ?? ""}`.localeCompare(
      `${b.displayName} ${b.username ?? ""}`,
      "th",
      { sensitivity: "base", numeric: true },
    );
  });
}
