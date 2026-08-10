import type { RoomRole, RoomType } from "@/lib/types/database";

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  friend: "กลุ่มเพื่อน",
  couple: "คู่รัก",
  family: "ครอบครัว",
};

export const ROOM_ROLE_LABEL: Record<RoomRole, string> = {
  owner: "เจ้าของ",
  member: "สมาชิก",
};

export type RoomModule = {
  key: string;
  title: string;
  description: string;
  href: "board" | "members" | "settings" | "";
};

/** โมดูลหลักในหน้าห้อง ตามชนิดห้อง */
export function getRoomHomeModules(type: RoomType): RoomModule[] {
  if (type === "couple") {
    return [
      {
        key: "board",
        title: "บอร์ดของเรา",
        description: "โน้ต เช็คลิสต์ และโพลสำหรับสองคน",
        href: "board",
      },
      {
        key: "members",
        title: "สมาชิก",
        description: "ดูคนในห้องและบทบาท",
        href: "members",
      },
    ];
  }

  if (type === "family") {
    return [
      {
        key: "board",
        title: "บอร์ดครอบครัว",
        description: "จัดกิจกรรมและข้อความสำคัญไว้ด้วยกัน",
        href: "board",
      },
      {
        key: "members",
        title: "สมาชิกครอบครัว",
        description: "รายชื่อคนในบ้านและสิทธิ์การเข้าถึง",
        href: "members",
      },
    ];
  }

  return [
    {
      key: "board",
      title: "บอร์ดเพื่อน",
      description: "ไอเดีย โพล และเช็คลิสต์ของกลุ่ม",
      href: "board",
    },
    {
      key: "members",
      title: "สมาชิกในกลุ่ม",
      description: "ดูเพื่อนในห้องและจัดการสิทธิ์",
      href: "members",
    },
  ];
}
