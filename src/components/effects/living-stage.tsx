"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { MagicBentoSpotlight } from "@/components/effects/magic-bento/MagicBentoCard";
import { useOptionalRoomTheme } from "@/components/rooms/room-theme-provider";
import { hexToRgbChannel } from "@/lib/rooms/themes";

type LivingStageProps = {
  children: ReactNode;
  className?: string;
  glowRgb?: string;
  /** เปิด/ปิด spotlight รวมของทั้งพื้นที่ ใช้ปิดในหน้าที่ต้องการ hover แยกเป็นรายการ์ด */
  spotlight?: boolean;
  style?: CSSProperties;
};

/** เวทีที่โคมตามเมาส์ไล่การ์ดในกริด */
export function LivingStage({
  children,
  className = "",
  glowRgb = "201, 184, 150",
  spotlight = true,
  style,
}: LivingStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const palette = useOptionalRoomTheme()?.currentTheme.palette;
  const glow = palette ? hexToRgbChannel(palette.primary) : glowRgb;

  return (
    <div
      className={`magic-bento-section${className ? ` ${className}` : ""}`}
      ref={ref}
      style={
        {
          ...style,
          "--glow-color": glow,
          ...(palette ? { "--room-accent": palette.primary } : {}),
        } as CSSProperties
      }
    >
      <MagicBentoSpotlight
        enabled={spotlight}
        glowColor={glow}
        sectionRef={ref}
      />
      {children}
    </div>
  );
}
