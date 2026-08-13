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

const DEFAULT_THEME: RoomTheme = {
  id: DEFAULT_ROOM_THEME_ID,
  name: "TogetherSpace",
  description: "ธีมมาตรฐานของเว็บไซต์ อ่านง่ายและคุ้นเคย",
  palette: {
    background: "#0d1424",
    surface: "#151d31",
    mutedSurface: "#1c2540",
    hover: "#243050",
    primary: "#e8a055",
    primaryHover: "#f0b56e",
    primarySoft: "#3a2a18",
    primaryText: "#1a1208",
    text: "#f3ede3",
    textMuted: "#a8b0c2",
    placeholder: "#6f788f",
    border: "#2a334a",
    borderStrong: "#3d4a66",
  },
};

const LIGHT_THEME: RoomTheme = {
  id: "warm-light",
  name: "Warm Light",
  description: "พื้นครีมอุ่น สบายตา เหมาะกับการใช้งานช่วงกลางวัน",
  palette: {
    background: "#f5f1e9",
    surface: "#fffaf2",
    mutedSurface: "#eee7dc",
    hover: "#e4dccf",
    primary: "#b96f2f",
    primaryHover: "#a86128",
    primarySoft: "#f2ddc7",
    primaryText: "#fffaf2",
    text: "#2b2825",
    textMuted: "#6f675f",
    placeholder: "#91877d",
    border: "#d7cec2",
    borderStrong: "#b9ad9f",
  },
};

const TYPE_THEME: Record<RoomType, RoomTheme> = {
  couple: {
    id: "rose-evening",
    name: "Rose Evening",
    description: "ชมพูกุหลาบนุ่มลึกสำหรับพื้นที่ของเราสองคน",
    palette: {
      background: "#17111b",
      surface: "#251925",
      mutedSurface: "#342234",
      hover: "#493047",
      primary: "#e6a0a8",
      primaryHover: "#f0b4bb",
      primarySoft: "#47252f",
      primaryText: "#28151a",
      text: "#f7ece9",
      textMuted: "#c4adb4",
      placeholder: "#917b84",
      border: "#493446",
      borderStrong: "#695064",
    },
  },
  family: {
    id: "calm-home",
    name: "Calm Home",
    description: "เขียวเทาสบายตา อ่านง่ายสำหรับสมาชิกทุกวัย",
    palette: {
      background: "#101817",
      surface: "#192522",
      mutedSurface: "#22332e",
      hover: "#2d443c",
      primary: "#d9ad68",
      primaryHover: "#e5bd7d",
      primarySoft: "#3e3220",
      primaryText: "#21180b",
      text: "#f1eee5",
      textMuted: "#aebbb5",
      placeholder: "#788b82",
      border: "#30423d",
      borderStrong: "#496159",
    },
  },
  friend: {
    id: "midnight-crew",
    name: "Midnight Crew",
    description: "น้ำเงินม่วงเข้มสำหรับกลุ่มเพื่อนที่ชอบบรรยากาศเท่ๆ",
    palette: {
      background: "#0f1020",
      surface: "#1a1c32",
      mutedSurface: "#252842",
      hover: "#343858",
      primary: "#c4a0ed",
      primaryHover: "#d2b4f3",
      primarySoft: "#382a4e",
      primaryText: "#20142d",
      text: "#f2eef8",
      textMuted: "#aaa9c2",
      placeholder: "#777690",
      border: "#343750",
      borderStrong: "#505473",
    },
  },
};

const TYPE_LIGHT_THEME: Record<RoomType, RoomTheme> = {
  couple: {
    id: "blush-morning",
    name: "Blush Morning",
    description: "ชมพูครีมอ่อนโยน สดใส และอบอุ่นสำหรับเราสองคน",
    palette: {
      background: "#fff5f3",
      surface: "#fffafb",
      mutedSurface: "#f8e8e7",
      hover: "#f1d9da",
      primary: "#b85f72",
      primaryHover: "#a94e62",
      primarySoft: "#f3d8dc",
      primaryText: "#fff8f8",
      text: "#3c292d",
      textMuted: "#7d6066",
      placeholder: "#a2868b",
      border: "#e5cfd1",
      borderStrong: "#caaeb3",
    },
  },
  family: {
    id: "sunny-home",
    name: "Sunny Home",
    description: "บ้านสว่างสดใส สีอ่านง่ายและเป็นมิตรกับสมาชิกทุกวัย",
    palette: {
      background: "#f5f8ee",
      surface: "#fffdf7",
      mutedSurface: "#e9f0dc",
      hover: "#dce8ca",
      primary: "#44795b",
      primaryHover: "#35694c",
      primarySoft: "#d9ead2",
      primaryText: "#f8fff8",
      text: "#28352c",
      textMuted: "#617066",
      placeholder: "#88958c",
      border: "#cedbc7",
      borderStrong: "#a8bca5",
    },
  },
  friend: {
    id: "day-trip",
    name: "Day Trip",
    description: "ฟ้าสดใสและครีมอุ่นสำหรับแผนเที่ยวและเรื่องสนุกของกลุ่ม",
    palette: {
      background: "#f1f7f9",
      surface: "#fbfdfd",
      mutedSurface: "#e1eef2",
      hover: "#d2e4e9",
      primary: "#34768b",
      primaryHover: "#286779",
      primarySoft: "#cfe5eb",
      primaryText: "#f8ffff",
      text: "#26373c",
      textMuted: "#60757c",
      placeholder: "#84969c",
      border: "#c8dce1",
      borderStrong: "#9fbac2",
    },
  },
};

/** คืนธีมมาตรฐาน ธีมสว่าง และธีมเฉพาะประเภทแบบมืด/สว่างตามลำดับ */
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
