"use client";

import { useEffect, useState } from "react";

import Lightfall from "@/components/effects/lightfall/Lightfall";
import styles from "@/components/layout/app-atmosphere.module.css";
import { useBackdropQuality } from "@/lib/motion/backdrop-quality";

const FALL = {
  friend: {
    backgroundColor: "#0A0908",
    colors: ["#C9B896", "#D8CBB0"],
  },
  couple: {
    backgroundColor: "#0A0908",
    colors: ["#C9968C", "#C9B896"],
  },
  family: {
    backgroundColor: "#0A0908",
    colors: ["#A8B08C", "#D8CBB0"],
  },
} as const;

type RoomTint = keyof typeof FALL;

/** Lightfall หลังล็อกอิน — เฉพาะเครื่องที่ไหว และไม่รันตอนอยู่ในห้อง */
export function AppLightfall() {
  const quality = useBackdropQuality();
  const [tint, setTint] = useState<RoomTint>("friend");
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const next = root.dataset.roomType;
      setTint(next === "couple" || next === "family" ? next : "friend");
      setInRoom(Boolean(next));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-room-type"],
    });
    return () => observer.disconnect();
  }, []);

  if (!quality?.allowLightfall || inRoom) return null;

  const theme = FALL[tint];

  return (
    <Lightfall
      backgroundColor={theme.backgroundColor}
      backgroundGlow={0.16}
      className={styles.rays}
      colors={[...theme.colors]}
      density={0.28}
      dpr={quality.dpr}
      glow={0.5}
      mixBlendMode="screen"
      mouseInteraction={false}
      opacity={0.38}
      speed={0.32}
      streakCount={2}
      streakLength={0.9}
      streakWidth={0.7}
      targetFps={quality.fps}
      twinkle={0.25}
      zoom={2.8}
    />
  );
}
