"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

import styles from "@/components/layout/app-shell.module.css";

/** หน้าห้องใช้เต็มจอ — ล็อบบี้ยังจำกัดความกว้าง */
export function AppMain({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isRoom = pathname.startsWith("/rooms/");

  return (
    <div className={isRoom ? styles.mainRoom : styles.main}>{children}</div>
  );
}
