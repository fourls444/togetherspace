import type { PropsWithChildren } from "react";

import styles from "@/components/ui/badge.module.css";

export function Badge({ children }: PropsWithChildren) {
  return <span className={styles.badge}>{children}</span>;
}
