import type { PropsWithChildren } from "react";

import styles from "@/components/ui/badge.module.css";

/** แสดงข้อความสถานะขนาดเล็ก เช่น บทบาทหรือจำนวนสมาชิก */
export function Badge({ children }: PropsWithChildren) {
  return <span className={styles.badge}>{children}</span>;
}
