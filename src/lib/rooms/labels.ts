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
  key: "album" | "board" | "calendar" | "members";
  title: string;
  description: string;
  href: "album" | "board" | "calendar" | "members";
};

const COUPLE_MODULES: RoomModule[] = [
  {
    key: "calendar",
    title: "ปฏิทินของเรา",
    description: "เก็บวันสำคัญ นัดเดต และกิจกรรมที่อยากจำไว้ด้วยกัน",
    href: "calendar",
  },
  {
    key: "album",
    title: "อัลบั้มของเรา",
    description: "รวมรูปเดต ทริป และโมเมนต์เล็กๆ ของสองคน",
    href: "album",
  },
  {
    key: "board",
    title: "บอร์ดของเรา",
    description: "จดไอเดีย เช็คลิสต์ และโพลที่ช่วยตัดสินใจด้วยกัน",
    href: "board",
  },
  {
    key: "members",
    title: "สมาชิกในห้อง",
    description: "ดูสมาชิกที่อยู่ในพื้นที่นี้",
    href: "members",
  },
];

const FAMILY_MODULES: RoomModule[] = [
  {
    key: "calendar",
    title: "ปฏิทินครอบครัว",
    description: "รวมวันสำคัญ นัดหมาย และกิจกรรมที่ทุกคนควรรู้",
    href: "calendar",
  },
  {
    key: "album",
    title: "อัลบั้มครอบครัว",
    description: "เก็บรูปบ้าน ทริป และช่วงเวลาของคนในครอบครัว",
    href: "album",
  },
  {
    key: "board",
    title: "บอร์ดครอบครัว",
    description: "ฝากข้อความ งานที่ต้องช่วยกันทำ และเรื่องที่ไม่อยากลืม",
    href: "board",
  },
  {
    key: "members",
    title: "คนในบ้าน",
    description: "ดูรายชื่อคนในครอบครัวที่อยู่ในห้อง",
    href: "members",
  },
];

const FRIEND_MODULES: RoomModule[] = [
  {
    key: "calendar",
    title: "ปฏิทินกลุ่ม",
    description: "นัดเจอ วันเกิด และแผนเที่ยวของเพื่อนๆ ในที่เดียว",
    href: "calendar",
  },
  {
    key: "album",
    title: "อัลบั้มเพื่อน",
    description: "แชร์รูปทริป งานเลี้ยง และโมเมนต์ของกลุ่ม",
    href: "album",
  },
  {
    key: "board",
    title: "บอร์ดเพื่อน",
    description: "โยนไอเดีย โหวตแผน และทำเช็คลิสต์ของแก๊ง",
    href: "board",
  },
  {
    key: "members",
    title: "เพื่อนในห้อง",
    description: "ดูว่าใครอยู่ด้วยกันตอนนี้",
    href: "members",
  },
];

/** คืนข้อความโมดูลหน้าหลักให้เหมาะกับประเภทห้อง */
export function getRoomHomeModules(type: RoomType): RoomModule[] {
  if (type === "couple") return COUPLE_MODULES;
  if (type === "family") return FAMILY_MODULES;
  return FRIEND_MODULES;
}
