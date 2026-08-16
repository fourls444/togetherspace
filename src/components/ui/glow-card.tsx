"use client";

import type { ReactNode } from "react";

import BorderGlow, {
  type BorderGlowProps,
} from "@/components/effects/border-glow/BorderGlow";
import { useOptionalRoomTheme } from "@/components/rooms/room-theme-provider";
import { ROOM_TYPE_THEME } from "@/lib/rooms/labels";
import { hexToHslSpace } from "@/lib/rooms/themes";
import type { RoomType } from "@/lib/types/database";

const ROOM_COLORS = ["#C9B896", "#D8CBB0", "#F6F1E8"] as const;
const DANGER_COLORS = ["#C97B7B", "#F3D4D0", "#C9B896"] as const;

type GlowCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** default = พื้นผิวห้อง · room = การ์ดใหญ่ · danger = โซนอันตราย */
  tone?: "default" | "room" | "danger";
  animated?: boolean;
  /** ทับสี mesh / พื้น / glow (เช่น แยกตามประเภทห้อง) */
  backgroundColor?: string;
  colors?: string[];
  glowColor?: string;
  roomType?: RoomType;
} & Pick<BorderGlowProps, "aria-label" | "role">;

/** การ์ด BorderGlow — ในห้องใช้พาเลตธีมที่เลือก ไม่ล็อกหมึก Atelier */
export function GlowCard({
  children,
  className,
  contentClassName,
  tone = "default",
  animated = false,
  backgroundColor,
  colors,
  glowColor,
  roomType,
  ...rest
}: GlowCardProps) {
  const isDanger = tone === "danger";
  const isRoom = tone === "room";
  const roomPalette = useOptionalRoomTheme()?.currentTheme.palette;
  const typeTheme = roomType ? ROOM_TYPE_THEME[roomType] : null;

  return (
    <BorderGlow
      {...rest}
      animated={animated}
      backgroundColor={
        backgroundColor ??
        (isDanger
          ? "#2A1818"
          : (roomPalette?.surface ?? typeTheme?.background ?? "#141210"))
      }
      borderRadius={isRoom ? 8 : 6}
      className={className}
      colors={
        colors ??
        (isDanger
          ? [...DANGER_COLORS]
          : roomPalette
            ? [
                roomPalette.primary,
                roomPalette.primaryHover,
                roomPalette.text,
              ]
            : typeTheme
              ? [...typeTheme.colors]
              : [...ROOM_COLORS])
      }
      coneSpread={22}
      contentClassName={contentClassName}
      edgeSensitivity={28}
      fillOpacity={0.12}
      glowColor={
        glowColor ??
        (isDanger
          ? "0 40 55"
          : roomPalette
            ? hexToHslSpace(roomPalette.primary)
            : (typeTheme?.glowColor ?? "40 30 69"))
      }
      glowIntensity={0.55}
      glowRadius={isRoom ? 20 : 16}
    >
      {children}
    </BorderGlow>
  );
}
