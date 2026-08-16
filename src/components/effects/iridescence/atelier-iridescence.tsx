"use client";

import Iridescence from "@/components/effects/iridescence/Iridescence";
import { useOptionalRoomTheme } from "@/components/rooms/room-theme-provider";
import { useBackdropQuality } from "@/lib/motion/backdrop-quality";
import { getRoomSilkMetal, hexToRgbTuple } from "@/lib/rooms/themes";
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
  roomType?: RoomType;
};

/** ไหมโลหะ — ในห้องย้อมตามธีมที่เลือก ไม่ล็อกแชมเปญ Atelier */
export function AtelierIridescence({
  className,
  color,
  roomType,
}: AtelierIridescenceProps) {
  const roomTheme = useOptionalRoomTheme();
  const quality = useBackdropQuality();
  if (!quality?.allowIridescence) return null;

  const theme = roomTheme?.currentTheme;
  const metal =
    color ??
    (theme
      ? hexToRgbTuple(getRoomSilkMetal(theme))
      : roomType
        ? METAL[roomType]
        : HERO_METAL);
  const ink = theme
    ? hexToRgbTuple(theme.palette.background)
    : HERO_INK;

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
