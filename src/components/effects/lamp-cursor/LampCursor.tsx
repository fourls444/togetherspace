"use client";

import { useEffect, useState } from "react";

import styles from "@/components/effects/lamp-cursor/LampCursor.module.css";

/** แสงโคมตามนิ้ว — React Bits spotlight ย่อเป็นโคมห้อง */
export function LampCursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(!motion.matches && hover.matches);
    sync();
    motion.addEventListener("change", sync);
    hover.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      hover.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const onMove = (event: PointerEvent) => {
      root.style.setProperty("--lamp-x", `${event.clientX}px`);
      root.style.setProperty("--lamp-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  if (!enabled) return null;
  return <div aria-hidden className={styles.lamp} />;
}
