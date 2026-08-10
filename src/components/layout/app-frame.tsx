import type { PropsWithChildren } from "react";

import { AppWavesBackground } from "@/components/layout/app-waves-background";
import {
  Sidebar,
  type RoomSidebarItem,
} from "@/components/layout/sidebar";
import styles from "@/components/layout/app-frame.module.css";

type AppFrameProps = PropsWithChildren<{
  rooms: RoomSidebarItem[];
  className?: string;
}>;

/** โครงหน้าแอปหลังล็อกอิน: sidebar + พื้นหลังคลื่น + เนื้อหา */
export function AppFrame({ rooms, children, className }: AppFrameProps) {
  const contentClass = [styles.content, className].filter(Boolean).join(" ");

  return (
    <div className={styles.frame}>
      <div className={styles.waves} aria-hidden>
        <AppWavesBackground />
      </div>
      <Sidebar rooms={rooms} />
      <div className={contentClass}>{children}</div>
    </div>
  );
}
