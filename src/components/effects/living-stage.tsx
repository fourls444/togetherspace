"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { MagicBentoSpotlight } from "@/components/effects/magic-bento/MagicBentoCard";
import { useOptionalRoomTheme } from "@/components/rooms/room-theme-provider";
import { hexToRgbChannel } from "@/lib/rooms/themes";

type LivingStageProps = {
  children: ReactNode;
  className?: string;
  glowRgb?: string;
  style?: CSSProperties;
};

/** เวทีที่โคมตามเมาส์ไล่การ์ดในกริด — ในห้องตามธีมที่เลือก */
export function LivingStage({
  children,
  className = "",
  glowRgb = "201, 184, 150",
  style,
}: LivingStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const roomTheme = useOptionalRoomTheme();
  const glow = roomTheme
    ? hexToRgbChannel(roomTheme.currentTheme.palette.primary)
    : glowRgb;

  return (
    <div
      className={`magic-bento-section${className ? ` ${className}` : ""}`}
      ref={ref}
      style={{ "--glow-color": glow, ...style } as CSSProperties}
    >
      <MagicBentoSpotlight glowColor={glow} sectionRef={ref} />
      {children}
    </div>
  );
}
