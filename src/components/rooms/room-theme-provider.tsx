"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type CSSProperties,
  type PropsWithChildren,
} from "react";

import styles from "@/components/rooms/room-theme.module.css";
import {
  DEFAULT_ROOM_THEME_ID,
  getRoomThemes,
  resolveRoomTheme,
  type RoomTheme,
  type RoomThemePalette,
} from "@/lib/rooms/themes";
import type { RoomType } from "@/lib/types/database";

type RoomThemeContextValue = {
  currentTheme: RoomTheme;
  roomType: RoomType;
  selectTheme: (themeId: string) => void;
  themes: RoomTheme[];
};

const RoomThemeContext = createContext<RoomThemeContextValue | null>(null);
const ROOM_THEME_CHANGE_EVENT = "togetherspace:room-theme-change";

const THEME_VARIABLES: Record<keyof RoomThemePalette, string> = {
  background: "--color-background",
  border: "--color-border",
  borderStrong: "--color-border-strong",
  hover: "--color-hover",
  mutedSurface: "--color-muted-surface",
  placeholder: "--color-placeholder",
  primary: "--color-primary",
  primaryHover: "--color-primary-hover",
  primarySoft: "--color-primary-soft",
  primaryText: "--color-primary-text",
  surface: "--color-surface",
  text: "--color-text",
  textMuted: "--color-text-muted",
};

/** สร้างชื่อช่องเก็บธีมแยกตามห้องเพื่อไม่ให้ค่าของแต่ละห้องทับกัน */
function getThemeStorageKey(roomCode: string): string {
  return `togetherspace:room-theme:${roomCode}`;
}

/** แปลงชุดสีเป็นตัวแปร CSS ให้ใช้เฉพาะภายในห้อง ไม่ทับแถบบนของแอป */
function getThemeStyle(theme: RoomTheme): CSSProperties {
  const variables = Object.fromEntries(
    Object.entries(THEME_VARIABLES).map(([paletteKey, variableName]) => [
      variableName,
      theme.palette[paletteKey as keyof RoomThemePalette],
    ]),
  );
  return {
    ...variables,
    "--color-focus": theme.palette.primaryHover,
    "--color-sidebar": theme.palette.mutedSurface,
    "--color-sidebar-hover": theme.palette.hover,
  } as CSSProperties;
}

/** ใช้ธีมกับเนื้อหาในห้อง และจำค่าที่เลือกไว้เฉพาะเบราว์เซอร์เครื่องปัจจุบัน */
export function RoomThemeProvider({
  children,
  roomCode,
  roomType,
}: PropsWithChildren<{
  roomCode: string;
  roomType: RoomType;
}>) {
  const themes = useMemo(() => getRoomThemes(roomType), [roomType]);
  const subscribeToTheme = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(ROOM_THEME_CHANGE_EVENT, onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(ROOM_THEME_CHANGE_EVENT, onStoreChange);
    };
  }, []);
  const getThemeSnapshot = useCallback(
    () => window.localStorage.getItem(getThemeStorageKey(roomCode)) ?? DEFAULT_ROOM_THEME_ID,
    [roomCode],
  );
  const themeId = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => DEFAULT_ROOM_THEME_ID,
  );
  const currentTheme = useMemo(
    () => resolveRoomTheme(roomType, themeId),
    [roomType, themeId],
  );

  const selectTheme = useCallback(
    (nextThemeId: string) => {
      const nextTheme = resolveRoomTheme(roomType, nextThemeId);
      window.localStorage.setItem(getThemeStorageKey(roomCode), nextTheme.id);
      window.dispatchEvent(new Event(ROOM_THEME_CHANGE_EVENT));
    },
    [roomCode, roomType],
  );

  const contextValue = useMemo(
    () => ({ currentTheme, roomType, selectTheme, themes }),
    [currentTheme, roomType, selectTheme, themes],
  );

  return (
    <RoomThemeContext.Provider value={contextValue}>
      <div
        className={styles.themeScope}
        data-room-theme={currentTheme.id}
        style={getThemeStyle(currentTheme)}
      >
        {children}
      </div>
    </RoomThemeContext.Provider>
  );
}

/** เปิดใช้ข้อมูลธีมห้องจากคอมโพเนนต์ที่อยู่ภายใน RoomThemeProvider */
export function useRoomTheme(): RoomThemeContextValue {
  const context = useContext(RoomThemeContext);
  if (!context) {
    throw new Error("useRoomTheme must be used inside RoomThemeProvider");
  }
  return context;
}
