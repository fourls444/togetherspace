"use client";

import type { ReactNode } from "react";

import BorderGlow, {
  type BorderGlowProps,
} from "@/components/effects/border-glow/BorderGlow";
import { useOptionalRoomTheme } from "@/components/rooms/room-theme-provider";
import { ROOM_TYPE_THEME } from "@/lib/rooms/labels";
import { hexToHslSpace } from "@/lib/rooms/themes";
import type { RoomType } from "@/lib/types/database";

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

/** การ์ด BorderGlow — ในห้องตามธีมที่เลือก นอกห้องใช้ Atelier */
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
  const roomTheme = useOptionalRoomTheme()?.currentTheme.palette;
  const typeTheme =
    !roomTheme && roomType ? ROOM_TYPE_THEME[roomType] : null;
  const surface = "var(--color-surface)";
  const mesh = roomTheme
    ? [roomTheme.primary, roomTheme.primaryHover, roomTheme.text]
    : typeTheme
      ? [...typeTheme.colors]
      : ["var(--color-primary)", "var(--color-primary-hover)", "var(--color-text)"];
  const edge = roomTheme
    ? hexToHslSpace(roomTheme.primary)
    : (typeTheme?.glowColor ?? "40 30 69");

  return (
    <BorderGlow
      {...rest}
      animated={animated}
      backgroundColor={
        backgroundColor ?? (isDanger ? "#2A1818" : surface)
      }
      borderRadius={isRoom ? 8 : 6}
      className={className}
      colors={colors ?? (isDanger ? [...DANGER_COLORS] : mesh)}
      coneSpread={22}
      contentClassName={contentClassName}
      edgeSensitivity={28}
      fillOpacity={0.12}
      glowColor={glowColor ?? (isDanger ? "0 40 55" : edge)}
      glowIntensity={0.55}
      glowRadius={isRoom ? 20 : 16}
    >
      {children}
    </BorderGlow>
  );
}
