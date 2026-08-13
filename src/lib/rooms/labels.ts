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

type RoomModuleKey =
  "album" | "board" | "calendar" | "finance" | "map" | "members";

export type RoomModule = {
  key: RoomModuleKey;
  title: string;
  description: string;
  href: RoomModuleKey;
};

const FINANCE_MODULES: Record<RoomType, RoomModule> = {
  couple: {
    key: "finance",
    title: "ค่าใช้จ่ายของเรา",
    description: "เก็บค่าเดต ค่าเดินทาง และยอดที่เราช่วยกันจ่ายไว้ในที่เดียว",
    href: "finance",
  },
  family: {
    key: "finance",
    title: "ค่าใช้จ่ายครอบครัว",
    description: "ดูรายรับ งบประมาณ และค่าใช้จ่ายของบ้านได้อย่างชัดเจน",
    href: "finance",
  },
  friend: {
    key: "finance",
    title: "หารค่าใช้จ่าย",
    description: "รวมเงินทริป คนที่ออกให้ก่อน และยอดที่คืนกันแล้ว",
    href: "finance",
  },
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
    description: "รวมรูปเดต ทริป และโมเมนต์เล็กๆ ของเราสองคน",
    href: "album",
  },
  {
    key: "board",
    title: "บอร์ดของเรา",
    description: "จดไอเดีย เช็คลิสต์ และโพลที่ช่วยตัดสินใจด้วยกัน",
    href: "board",
  },
  {
    key: "map",
    title: "แผนที่ความทรงจำ",
    description: "ปักหมุดร้านโปรด ที่เที่ยว และสถานที่ที่มีเรื่องราวของเรา",
    href: "map",
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
    key: "map",
    title: "แผนที่บ้านและทริป",
    description: "เก็บสถานที่สำคัญ ร้านประจำ และจุดหมายของครอบครัว",
    href: "map",
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
    description: "รวมนัดเจอ วันเกิด และแผนเที่ยวของเพื่อนๆ ไว้ในที่เดียว",
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
    description: "โยนไอเดีย โหวตแผน และทำเช็คลิสต์ของกลุ่ม",
    href: "board",
  },
  {
    key: "map",
    title: "แผนที่กลุ่ม",
    description: "ปักหมุดร้านนัดเจอ คาเฟ่ ที่เที่ยว และจุดหมายรอบหน้า",
    href: "map",
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
  const modules =
    type === "couple"
      ? COUPLE_MODULES
      : type === "family"
        ? FAMILY_MODULES
        : FRIEND_MODULES;
  const memberIndex = modules.findIndex((module) => module.key === "members");
  return [
    ...modules.slice(0, memberIndex),
    FINANCE_MODULES[type],
    ...modules.slice(memberIndex),
  ];
}
