"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { MagicBentoSpotlight } from "@/components/effects/magic-bento/MagicBentoCard";

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

  return (
    <div
      className={`magic-bento-section${className ? ` ${className}` : ""}`}
      ref={ref}
      style={{ "--glow-color": glowRgb, ...style } as CSSProperties}
    >
      <MagicBentoSpotlight
        enabled={spotlight}
        glowColor={glowRgb}
        sectionRef={ref}
      />
      {children}
    </div>
  );
}
