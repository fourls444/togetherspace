"use client";

import { useEffect, useState } from "react";

import FloatingLines from "@/components/effects/floating-lines/FloatingLines";
import styles from "@/components/layout/app-atmosphere.module.css";
import { useBackdropQuality } from "@/lib/motion/backdrop-quality";

const ATELIER_LINES = ["#1C1A17", "#A39E94", "#C9B896"];

/** FloatingLines หลังล็อกอิน — แชมเปญ Atelier ไม่รันตอนอยู่ในห้อง */
export function AppFloatingLines() {
  const quality = useBackdropQuality();
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setInRoom(Boolean(root.dataset.roomType));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-room-type"],
    });
    return () => observer.disconnect();
  }, []);

  if (!quality?.allowLightfall || inRoom) return null;

  return (
    <FloatingLines
      animationSpeed={0.7}
      bendRadius={5}
      bendStrength={-0.5}
      className={styles.lines}
      enabledWaves={["top", "middle", "bottom"]}
      interactive
      lineCount={[7, 10, 13]}
      lineDistance={[8, 6, 5]}
      linesGradient={ATELIER_LINES}
      mixBlendMode="screen"
      parallax
      parallaxStrength={0.12}
      pointerTarget="window"
    />
  );
}
