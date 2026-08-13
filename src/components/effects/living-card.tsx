"use client";

import { type CSSProperties, type ReactNode } from "react";

import { MagicBentoCard } from "@/components/effects/magic-bento/MagicBentoCard";

type LivingCardProps = {
  children: ReactNode;
  className?: string;
  glowRgb?: string;
};

/** การ์ดที่รับแสงโลหะตามเมาส์ — Magic Bento โทน Atelier */
export function LivingCard({
  children,
  className = "",
  glowRgb = "201, 184, 150",
}: LivingCardProps) {
  return (
    <MagicBentoCard
      className={className}
      clickEffect={false}
      enableBorderGlow
      enableMagnetism={false}
      enableStars={false}
      enableTilt={false}
      glowColor={glowRgb}
      style={{ borderRadius: "inherit" } as CSSProperties}
    >
      {children}
    </MagicBentoCard>
  );
}
