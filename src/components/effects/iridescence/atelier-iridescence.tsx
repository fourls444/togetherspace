"use client";

import Iridescence from "@/components/effects/iridescence/Iridescence";
import { useOptionalRoomTheme } from "@/components/rooms/room-theme-provider";
import { useBackdropQuality } from "@/lib/motion/backdrop-quality";
import { hexToRgbTuple } from "@/lib/rooms/themes";
import type { RoomType } from "@/lib/types/database";

const METAL: Record<RoomType, [number, number, number]> = {
  friend: [0.788, 0.722, 0.588],
  couple: [0.788, 0.588, 0.549],
  family: [0.659, 0.69, 0.549],
};

const HERO_METAL: [number, number, number] = [0.788, 0.722, 0.588];
const HERO_INK: [number, number, number] = [0.039, 0.035, 0.031];

type AtelierIridescenceProps = {
  className?: string;
  color?: [number, number, number];
  ink?: [number, number, number];
  roomType?: RoomType;
};

/** ไหมโลหะตามธีมห้อง — นอกห้องยังใช้แชมเปญชุดการ์ดต้อนรับ */
export function AtelierIridescence({
  className,
  color,
  ink: inkOverride,
  roomType,
}: AtelierIridescenceProps) {
  const quality = useBackdropQuality();
  const roomTheme = useOptionalRoomTheme();
  if (!quality?.allowIridescence) return null;

  const palette = roomTheme?.currentTheme.palette;
  const metal =
    color ??
    (palette
      ? hexToRgbTuple(palette.primary)
      : roomType
        ? METAL[roomType]
        : HERO_METAL);
  const ink =
    inkOverride ?? (palette ? hexToRgbTuple(palette.background) : HERO_INK);

  return (
    <Iridescence
      amplitude={0.06}
      className={className}
      color={metal}
      dpr={quality.dpr}
      ink={ink}
      live={quality.animateIridescence}
      mouseReact={false}
      speed={0.28}
      targetFps={quality.fps}
    />
  );
}
