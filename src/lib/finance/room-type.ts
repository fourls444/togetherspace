import type { RoomType } from "@/lib/types/database";

export type FinanceRoomConfig = {
  categories: readonly string[];
  description: string;
  eyebrow: string;
  supportsBudgets: boolean;
  supportsFunds: boolean;
  supportsIncome: boolean;
  supportsRepayments: boolean;
  supportsTrips: boolean;
  title: string;
};

export const FINANCE_ROOM_CONFIG: Record<RoomType, FinanceRoomConfig> = {
  friend: {
    eyebrow: "เงินของกลุ่มเพื่อน",
    title: "ทริป กองกลาง และยอดคืนเงิน",
    description: "รู้ว่าใครออกให้ก่อน ใครคืนแล้ว และเงินกองกลางของทริปเหลือเท่าไร",
    categories: ["อาหารและเครื่องดื่ม", "เดินทาง", "ที่พัก", "กิจกรรม", "เงินกองกลาง", "อื่นๆ"],
    supportsBudgets: false,
    supportsFunds: true,
    supportsIncome: false,
    supportsRepayments: true,
    supportsTrips: true,
  },
  couple: {
    eyebrow: "การเงินของคู่รัก",
    title: "กองเดตและค่าใช้จ่ายของเรา",
    description: "เก็บเงินสำหรับเดต แบ่งค่าใช้จ่าย และดูว่าเราใช้ไปกับอะไรบ้าง",
    categories: ["เดต", "อาหาร", "ของขวัญ", "เดินทาง", "เงินกองกลาง", "อื่นๆ"],
    supportsBudgets: false,
    supportsFunds: true,
    supportsIncome: false,
    supportsRepayments: false,
    supportsTrips: false,
  },
  family: {
    eyebrow: "การเงินของครอบครัว",
    title: "รายรับ งบประมาณ และค่าใช้จ่ายในบ้าน",
    description: "เห็นรายรับของสมาชิก วางงบรายหมวด และติดตามค่าใช้จ่ายของครอบครัวในที่เดียว",
    categories: ["อาหารในบ้าน", "ที่อยู่อาศัย", "สาธารณูปโภค", "การศึกษา", "สุขภาพ", "เดินทาง", "อื่นๆ"],
    supportsBudgets: true,
    supportsFunds: false,
    supportsIncome: true,
    supportsRepayments: false,
    supportsTrips: false,
  },
};

/** คืนค่าตั้งต้นของ Finance ตามประเภทห้องเพื่อให้ทั้งหน้าและ validation ใช้ข้อมูลชุดเดียวกัน */
export function getFinanceRoomConfig(roomType: RoomType): FinanceRoomConfig {
  return FINANCE_ROOM_CONFIG[roomType];
}

/** ตรวจว่าหมวดค่าใช้จ่ายเป็นหนึ่งในตัวเลือกของห้องประเภทนั้น */
export function isFinanceCategoryAllowed(roomType: RoomType, category: string): boolean {
  return FINANCE_ROOM_CONFIG[roomType].categories.includes(category);
}
