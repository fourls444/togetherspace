"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PropsWithChildren,
} from "react";

import styles from "@/components/rooms/room-theme.module.css";
import {
  DEFAULT_ROOM_THEME_ID,
  getRoomThemes,
  hexToHslSpace,
  hexToRgbChannel,
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

type ThemeFlash = {
  id: number;
  ink: string;
  sheen: string;
};

const RoomThemeContext = createContext<RoomThemeContextValue | null>(null);
const ROOM_THEME_CHANGE_EVENT = "togetherspace:room-theme-change";
const THEME_FLASH_PEAK_MS = 240;
const THEME_FLASH_MS = 720;

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
    "--control-bg": theme.palette.background,
    "--control-border": theme.palette.border,
    "--glow-color": hexToRgbChannel(theme.palette.primary),
    "--room-glow-hsl": hexToHslSpace(theme.palette.primary),
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
  const [flash, setFlash] = useState<ThemeFlash | null>(null);
  const flashLock = useRef(false);
  const peakTimer = useRef(0);
  const endTimer = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(peakTimer.current);
      window.clearTimeout(endTimer.current);
    },
    [],
  );

  const applyTheme = useCallback(
    (nextThemeId: string) => {
      const nextTheme = resolveRoomTheme(roomType, nextThemeId);
      window.localStorage.setItem(getThemeStorageKey(roomCode), nextTheme.id);
      window.dispatchEvent(new Event(ROOM_THEME_CHANGE_EVENT));
    },
    [roomCode, roomType],
  );

  const selectTheme = useCallback(
    (nextThemeId: string) => {
      const nextTheme = resolveRoomTheme(roomType, nextThemeId);
      if (nextTheme.id === currentTheme.id || flashLock.current) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        applyTheme(nextTheme.id);
        return;
      }

      flashLock.current = true;
      setFlash({
        id: Date.now(),
        ink: nextTheme.palette.background,
        sheen:
          nextTheme.id === "warm-light"
            ? nextTheme.palette.primaryText
            : nextTheme.palette.primary,
      });
      window.clearTimeout(peakTimer.current);
      window.clearTimeout(endTimer.current);
      peakTimer.current = window.setTimeout(() => {
        applyTheme(nextTheme.id);
      }, THEME_FLASH_PEAK_MS);
      endTimer.current = window.setTimeout(() => {
        flashLock.current = false;
        setFlash(null);
      }, THEME_FLASH_MS);
    },
    [applyTheme, currentTheme.id, roomType],
  );

  const endFlash = useCallback(() => {
    window.clearTimeout(endTimer.current);
    flashLock.current = false;
    setFlash(null);
  }, []);

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
        {flash ? (
          <div
            aria-hidden
            className={styles.flash}
            key={flash.id}
            style={
              {
                "--flash-ink": flash.ink,
                "--flash-sheen": flash.sheen,
              } as CSSProperties
            }
          >
            <span className={styles.flashWash} />
            <span className={styles.flashSheen} onAnimationEnd={endFlash} />
          </div>
        ) : null}
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

/** อ่านธีมห้องถ้ามี — ใช้กับการ์ดที่อยู่ทั้งในและนอกห้อง */
export function useOptionalRoomTheme(): RoomThemeContextValue | null {
  return useContext(RoomThemeContext);
}

/** คัดลอกตัวแปรธีมไปยัง overlay ที่ portal ออกนอกห้อง */
export function readActiveRoomThemePortalProps(): {
  "data-room-theme"?: string;
  style?: CSSProperties;
} {
  if (typeof document === "undefined") return {};
  const themeScope = document.querySelector<HTMLElement>("[data-room-theme]");
  if (!themeScope) return {};
  const style: Record<string, string> = {
    color: "var(--color-text)",
  };
  for (const name of themeScope.style) {
    style[name] = themeScope.style.getPropertyValue(name);
  }
  return {
    "data-room-theme": themeScope.getAttribute("data-room-theme") ?? undefined,
    style: style as CSSProperties,
  };
}
