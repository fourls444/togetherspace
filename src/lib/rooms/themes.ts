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

const ATELIER: RoomThemePalette = {
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

const PAPER_DAY: RoomThemePalette = {
  background: "#A89B8C",
  surface: "#B5A898",
  mutedSurface: "#9A8E80",
  hover: "#8C8174",
  primary: "#1C1915",
  primaryHover: "#2E2A24",
  primarySoft: "#8A7F72",
  primaryText: "#E4D9CC",
  text: "#1C1915",
  textMuted: "#3D372F",
  placeholder: "#5C554C",
  border: "#7D7266",
  borderStrong: "#6A6056",
};

const ROSE_CHAMBER: RoomThemePalette = {
  background: "#160D10",
  surface: "#221418",
  mutedSurface: "#2C1A20",
  hover: "#38242B",
  primary: "#E8A8B6",
  primaryHover: "#F0BCC6",
  primarySoft: "#3A222A",
  primaryText: "#2A1218",
  text: "#F7EEF0",
  textMuted: "#C9A8B0",
  placeholder: "#A88890",
  border: "#3D2A30",
  borderStrong: "#4E3840",
};

const MOSS_HALL: RoomThemePalette = {
  background: "#0C100C",
  surface: "#141A14",
  mutedSurface: "#1B231B",
  hover: "#243024",
  primary: "#8FA876",
  primaryHover: "#A3BC8C",
  primarySoft: "#1E2A1C",
  primaryText: "#12180F",
  text: "#E8F0E4",
  textMuted: "#9AAB94",
  placeholder: "#7A8A74",
  border: "#2A3328",
  borderStrong: "#3A4636",
};

const ROOM_THEMES: RoomTheme[] = [
  {
    id: DEFAULT_ROOM_THEME_ID,
    name: "Private Atelier",
    description: "ห้องหลังค่ำชุดหลัก หมึกอุ่น ตัวอักษรงาช้าง ปุ่มแชมเปญ",
    palette: ATELIER,
  },
  {
    id: "warm-light",
    name: "Linen",
    description: "ผ้าลินินแสงโคม ตัวอักษรหมึก อ่านได้นาน",
    palette: PAPER_DAY,
  },
  {
    id: "rose-evening",
    name: "Rosewood",
    description: "ไวน์และกลีบกุหลาบ ห้องค่ำสำหรับสองคน",
    palette: ROSE_CHAMBER,
  },
  {
    id: "calm-home",
    name: "Sage",
    description: "เขียวมะกอกนุ่ม โถงบ้านที่อยากได้ความสงบ",
    palette: MOSS_HALL,
  },
];

const LEGACY_THEME_IDS: Record<string, string> = {
  "blush-morning": "rose-evening",
  "day-trip": "warm-light",
  "midnight-crew": DEFAULT_ROOM_THEME_ID,
  "sunny-home": "calm-home",
};

/** สี่ขั้วที่ใช้ได้ทุกประเภทห้อง — หมึก / กระดาษ / ชมพู / มะกอก */
export function getRoomThemes(_type?: RoomType): RoomTheme[] {
  return ROOM_THEMES;
}

/** ป้องกันค่าเก่าหรือธีมที่ไม่มีแล้ว แล้วย้อนกลับไปธีมมาตรฐาน */
export function resolveRoomTheme(
  _type: RoomType,
  themeId: string | null,
): RoomTheme {
  const resolvedId = themeId ? (LEGACY_THEME_IDS[themeId] ?? themeId) : null;
  return (
    ROOM_THEMES.find((theme) => theme.id === resolvedId) ?? ROOM_THEMES[0]!
  );
}

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : raw;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return [0.79, 0.72, 0.59];
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

/** แปลงสีธีมเป็น RGB 0–1 สำหรับผ้าไหม WebGL */
export function hexToRgbTuple(hex: string): [number, number, number] {
  return parseHex(hex);
}

/** แปลงสีธีมเป็นช่อง RGB สำหรับ glow ของการ์ด */
export function hexToRgbChannel(hex: string): string {
  const [red, green, blue] = parseHex(hex);
  return `${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(blue * 255)}`;
}

/** สีไหมของพื้นห้อง — Linen ใช้ลายใยผ้า ไม่ใช้โลหะแชมเปญ */
export function getRoomSilkMetal(theme: RoomTheme): string {
  if (theme.id === "warm-light") return theme.palette.mutedSurface;
  return theme.palette.primary;
}

/** แปลงสีธีมเป็น HSL แบบที่ BorderGlow อ่านได้ */
export function hexToHslSpace(hex: string): string {
  const [red, green, blue] = parseHex(hex);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const light = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let sat = 0;
  if (delta !== 0) {
    sat =
      light > 0.5 ? delta / (2 - max - min) : delta / Math.max(max + min, 0.0001);
    if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6;
    else if (max === green) hue = ((blue - red) / delta + 2) / 6;
    else hue = ((red - green) / delta + 4) / 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)} ${Math.round(light * 100)}`;
}
