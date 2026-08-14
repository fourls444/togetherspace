"use client";

import { type CSSProperties, type ReactNode } from "react";

import { MagicBentoCard } from "@/components/effects/magic-bento/MagicBentoCard";
import { useOptionalRoomTheme } from "@/components/rooms/room-theme-provider";
import { hexToRgbChannel } from "@/lib/rooms/themes";

type LivingCardProps = {
  children: ReactNode;
  className?: string;
  glowRgb?: string;
};

/** การ์ดที่รับแสงโลหะตามเมาส์ — ในห้องใช้สีธีมที่เลือก */
export function LivingCard({
  children,
  className = "",
  glowRgb = "201, 184, 150",
}: LivingCardProps) {
  const roomTheme = useOptionalRoomTheme();
  const glow = roomTheme
    ? hexToRgbChannel(roomTheme.currentTheme.palette.primary)
    : glowRgb;

  return (
    <MagicBentoCard
      className={className}
      clickEffect={false}
      enableBorderGlow
      enableMagnetism={false}
      enableStars={false}
      enableTilt={false}
      glowColor={glow}
      style={{ borderRadius: "inherit" } as CSSProperties}
    >
      {children}
    </MagicBentoCard>
  );
}
