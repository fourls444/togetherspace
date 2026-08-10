import type { PropsWithChildren, ReactNode } from "react";

import { AppAtmosphere } from "@/components/layout/app-atmosphere";
import { NavProgress } from "@/components/layout/nav-progress";
import styles from "@/components/layout/app-frame.module.css";

type AppFrameProps = PropsWithChildren<{
  sidebar: ReactNode;
  className?: string;
}>;

/** โครงหน้าแอปหลังล็อกอิน: sidebar + พื้นหลัง CSS + เนื้อหา */
export function AppFrame({ sidebar, children, className }: AppFrameProps) {
  const contentClass = [styles.content, className].filter(Boolean).join(" ");

  return (
    <div className={styles.frame}>
      <AppAtmosphere />
      <NavProgress />
      {sidebar}
      <div className={contentClass}>{children}</div>
    </div>
  );
}
