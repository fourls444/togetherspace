"use client";

import Iridescence from "@/components/effects/iridescence/Iridescence";
import { useBackdropQuality } from "@/lib/motion/backdrop-quality";
import type { RoomType } from "@/lib/types/database";

const METAL: Record<RoomType, [number, number, number]> = {
  friend: [0.788, 0.722, 0.588],
  couple: [0.788, 0.588, 0.549],
  family: [0.659, 0.69, 0.549],
};

const HERO_METAL: [number, number, number] = [0.788, 0.722, 0.588];

type AtelierIridescenceProps = {
  className?: string;
  color?: [number, number, number];
  roomType?: RoomType;
};

/** ไหมโลหะชุดเดียวกับการ์ดต้อนรับ — เครื่องอ่อนวาดเฟรมเดียว */
export function AtelierIridescence({
  className,
  color,
  roomType,
}: AtelierIridescenceProps) {
  const quality = useBackdropQuality();
  if (!quality?.allowIridescence) return null;

  const metal = color ?? (roomType ? METAL[roomType] : HERO_METAL);

  return (
    <Iridescence
      amplitude={0.06}
      className={className}
      color={metal}
      dpr={quality.dpr}
      live={quality.animateIridescence}
      mouseReact={false}
      speed={0.28}
      targetFps={quality.fps}
    />
  );
}
