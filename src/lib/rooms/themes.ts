import type { RoomType } from "@/lib/types/database";

export const DEFAULT_ROOM_THEME_ID = "togetherspace";

export type RoomThemePalette = {
  background: string;
  border: string;
  borderStrong: string;
  hover: string;
  mutedSurface: string;
  placeholder: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryText: string;
  surface: string;
  text: string;
  textMuted: string;
};

export type RoomTheme = {
  description: string;
  id: string;
  name: string;
  palette: RoomThemePalette;
};

const ATELIER_INK: RoomThemePalette = {
  background: "#0A0908",
  surface: "#141210",
  mutedSurface: "#1C1A17",
  hover: "#25221E",
  primary: "#C9B896",
  primaryHover: "#D8CBB0",
  primarySoft: "#2A261F",
  primaryText: "#1A1612",
  text: "#F6F1E8",
  textMuted: "#A39E94",
  placeholder: "#8A847A",
  border: "#2E2B26",
  borderStrong: "#3D3933",
};

const ATELIER_LAMP: RoomThemePalette = {
  ...ATELIER_INK,
  background: "#1C1A17",
  surface: "#25221E",
  mutedSurface: "#2A261F",
  hover: "#2E2B26",
};

function withMetal(
  base: RoomThemePalette,
  primary: string,
): RoomThemePalette {
  return { ...base, primary };
}

const DEFAULT_THEME: RoomTheme = {
  id: DEFAULT_ROOM_THEME_ID,
  name: "Private Atelier",
  description: "หมึกอุ่น งาช้าง และโลหะแชมเปญ — ธีมหลักของบ้านหลังนี้",
  palette: ATELIER_INK,
};

const LIGHT_THEME: RoomTheme = {
  id: "warm-light",
  name: "Lamp Room",
  description: "หมึกโทนสว่างขึ้นเล็กน้อย เหมือนเปิดโคมในห้องทำงาน",
  palette: ATELIER_LAMP,
};

const TYPE_THEME: Record<RoomType, RoomTheme> = {
  couple: {
    id: "rose-evening",
    name: "Rose Gold",
    description: "โรสโกลด์บนหมึกอุ่น สำหรับพื้นที่ของเราสองคน",
    palette: withMetal(ATELIER_INK, "#C9968C"),
  },
  family: {
    id: "calm-home",
    name: "Sage Bronze",
    description: "ทองมะกอกบนหมึกอุ่น อ่านง่ายสำหรับทุกวัยในบ้าน",
    palette: withMetal(ATELIER_INK, "#A8B08C"),
  },
  friend: {
    id: "midnight-crew",
    name: "Champagne",
    description: "โลหะแชมเปญบนหมึกอุ่น สำหรับกลุ่มเพื่อน",
    palette: withMetal(ATELIER_INK, "#C9B896"),
  },
};

const TYPE_LIGHT_THEME: Record<RoomType, RoomTheme> = {
  couple: {
    id: "blush-morning",
    name: "Rose Lamp",
    description: "โรสโกลด์บนห้องโคมสว่างขึ้นเล็กน้อย",
    palette: withMetal(ATELIER_LAMP, "#C9968C"),
  },
  family: {
    id: "sunny-home",
    name: "Sage Lamp",
    description: "ทองมะกอกบนห้องโคมสว่างขึ้นเล็กน้อย",
    palette: withMetal(ATELIER_LAMP, "#A8B08C"),
  },
  friend: {
    id: "day-trip",
    name: "Champagne Lamp",
    description: "โลหะแชมเปญบนห้องโคมสว่างขึ้นเล็กน้อย",
    palette: withMetal(ATELIER_LAMP, "#C9B896"),
  },
};

/** คืนธีมมาตรฐาน ธีมโคมสว่าง และธีมโลหะตามประเภทห้อง */
export function getRoomThemes(type: RoomType): RoomTheme[] {
  return [DEFAULT_THEME, LIGHT_THEME, TYPE_THEME[type], TYPE_LIGHT_THEME[type]];
}

/** ป้องกันการใช้ธีมของห้องประเภทอื่นและย้อนกลับไปธีมมาตรฐานเมื่อค่าไม่ถูกต้อง */
export function resolveRoomTheme(
  type: RoomType,
  themeId: string | null,
): RoomTheme {
  return (
    getRoomThemes(type).find((theme) => theme.id === themeId) ?? DEFAULT_THEME
  );
}
