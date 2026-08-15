import type { RoomRole, RoomType } from "@/lib/types/database";

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  friend: "กลุ่มเพื่อน",
  couple: "คู่รัก",
  family: "ครอบครัว",
};

/** บรรทัดบรรยากาศสั้นๆ บนการ์ดห้อง */
export const ROOM_TYPE_BLURB: Record<RoomType, string> = {
  friend: "มุมคุยเล่นของกลุ่ม",
  couple: "พื้นที่สองคนของเรา",
  family: "บ้านหลังเล็กของครอบครัว",
};

/** สีการ์ดตามประเภท — Private Atelier โลหะคนละโทน */
export const ROOM_TYPE_THEME: Record<
  RoomType,
  {
    background: string;
    accent: string;
    colors: [string, string, string];
    glowColor: string;
    sparkRgb: string;
  }
> = {
  friend: {
    background: "#141210",
    accent: "#C9B896",
    colors: ["#C9B896", "#D8CBB0", "#F6F1E8"],
    glowColor: "40 30 69",
    sparkRgb: "201, 184, 150",
  },
  couple: {
    background: "#141210",
    accent: "#C9968C",
    colors: ["#C9968C", "#D8B4AC", "#F6F1E8"],
    glowColor: "8 32 68",
    sparkRgb: "201, 150, 140",
  },
  family: {
    background: "#141210",
    accent: "#A8B08C",
    colors: ["#A8B08C", "#C4C8A8", "#F6F1E8"],
    glowColor: "75 18 62",
    sparkRgb: "168, 176, 140",
  },
};

export const ROOM_ROLE_LABEL: Record<RoomRole, string> = {
  owner: "เจ้าของ",
  member: "สมาชิก",
};

type RoomModuleKey =
  | "album"
  | "board"
  | "calendar"
  | "family-tree"
  | "finance"
  | "friend-profiles"
  | "map"
  | "members";

export type RoomModule = {
  key: RoomModuleKey;
  title: string;
  description: string;
  href: RoomModuleKey;
};

const FINANCE_MODULES: Record<RoomType, RoomModule> = {
  couple: {
    key: "finance",
    title: "การเงิน",
    description: "เก็บค่าเดต ค่าเดินทาง และยอดที่เราช่วยกันจ่ายไว้ในที่เดียว",
    href: "finance",
  },
  family: {
    key: "finance",
    title: "การเงิน",
    description: "ดูรายรับ งบประมาณ และค่าใช้จ่ายของบ้านได้อย่างชัดเจน",
    href: "finance",
  },
  friend: {
    key: "finance",
    title: "การเงิน",
    description: "รวมเงินทริป คนที่ออกให้ก่อน และยอดที่คืนกันแล้ว",
    href: "finance",
  },
};

const COUPLE_MODULES: RoomModule[] = [
  {
    key: "calendar",
    title: "ปฏิทิน",
    description: "เก็บวันสำคัญ นัดเดต และกิจกรรมที่อยากจำไว้ด้วยกัน",
    href: "calendar",
  },
  {
    key: "album",
    title: "อัลบั้ม",
    description: "รวมรูปเดต ทริป และโมเมนต์เล็กๆ ของเราสองคน",
    href: "album",
  },
  {
    key: "board",
    title: "บอร์ด",
    description: "จดไอเดีย เช็คลิสต์ และโพลที่ช่วยตัดสินใจด้วยกัน",
    href: "board",
  },
  {
    key: "map",
    title: "แผนที่",
    description: "ปักหมุดร้านโปรด ที่เที่ยว และสถานที่ที่มีเรื่องราวของเรา",
    href: "map",
  },
  {
    key: "members",
    title: "สมาชิก",
    description: "ดูสมาชิกที่อยู่ในพื้นที่นี้",
    href: "members",
  },
];

const FAMILY_MODULES: RoomModule[] = [
  {
    key: "calendar",
    title: "ปฏิทิน",
    description: "รวมวันสำคัญ นัดหมาย และกิจกรรมที่ทุกคนควรรู้",
    href: "calendar",
  },
  {
    key: "album",
    title: "อัลบั้ม",
    description: "เก็บรูปบ้าน ทริป และช่วงเวลาของคนในครอบครัว",
    href: "album",
  },
  {
    key: "board",
    title: "บอร์ด",
    description: "ฝากข้อความ งานที่ต้องช่วยกันทำ และเรื่องที่ไม่อยากลืม",
    href: "board",
  },
  {
    key: "map",
    title: "แผนที่",
    description: "เก็บสถานที่สำคัญ ร้านประจำ และจุดหมายของครอบครัว",
    href: "map",
  },
  {
    key: "family-tree",
    title: "ผังครอบครัว",
    description: "จัดวางพ่อแม่ ลูก และพี่น้องในผังเดียวของบ้าน",
    href: "family-tree",
  },
  {
    key: "members",
    title: "สมาชิก",
    description: "ดูรายชื่อคนในครอบครัวที่อยู่ในห้อง",
    href: "members",
  },
];

const FRIEND_MODULES: RoomModule[] = [
  {
    key: "friend-profiles",
    title: "โปรไฟล์เพื่อน",
    description: "ทำความรู้จักและดูข้อมูลแนะนำตัวของเพื่อนในห้อง",
    href: "friend-profiles",
  },
  {
    key: "calendar",
    title: "ปฏิทิน",
    description: "รวมนัดเจอ วันเกิด และแผนเที่ยวของเพื่อนๆ ไว้ในที่เดียว",
    href: "calendar",
  },
  {
    key: "album",
    title: "อัลบั้ม",
    description: "แชร์รูปทริป งานเลี้ยง และโมเมนต์ของกลุ่ม",
    href: "album",
  },
  {
    key: "board",
    title: "บอร์ด",
    description: "โยนไอเดีย โหวตแผน และทำเช็คลิสต์ของกลุ่ม",
    href: "board",
  },
  {
    key: "map",
    title: "แผนที่",
    description: "ปักหมุดร้านนัดเจอ คาเฟ่ ที่เที่ยว และจุดหมายรอบหน้า",
    href: "map",
  },
  {
    key: "members",
    title: "สมาชิก",
    description: "ดูสมาชิกและเปิดโปรไฟล์เพื่อนแต่ละคนได้จากหน้านี้",
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
