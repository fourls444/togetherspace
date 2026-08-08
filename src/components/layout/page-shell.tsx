import type { PropsWithChildren } from "react";

import styles from "@/components/layout/page-shell.module.css";

type PageShellProps = PropsWithChildren<{
  className?: string;
}>;

export function PageShell({ children, className }: PageShellProps) {
  const classes = [styles.shell, className].filter(Boolean).join(" ");
  return <main className={classes}>{children}</main>;
}
