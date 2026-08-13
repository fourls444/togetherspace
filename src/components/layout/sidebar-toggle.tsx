"use client";

import styles from "@/components/layout/app-topbar.module.css";
import { useRoomSidebar } from "@/components/layout/room-sidebar-context";

export function SidebarToggle() {
  const { hasSidebar, isOpen, toggle } = useRoomSidebar();

  if (!hasSidebar) return null;

  return (
    <button
      aria-controls="room-alcove"
      aria-expanded={isOpen}
      aria-label={isOpen ? "ปิดเมนูห้อง" : "เปิดเมนูห้อง"}
      className={styles.menu}
      data-open={isOpen ? "true" : "false"}
      onClick={toggle}
      type="button"
    >
      <span className={styles.menuIcon}>
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}
