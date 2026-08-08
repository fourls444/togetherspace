import type { PropsWithChildren } from "react";

import styles from "@/components/ui/panel.module.css";

type PanelProps = PropsWithChildren<{
  as?: "div" | "section" | "header";
  className?: string;
}>;

export function Panel({
  as: Component = "section",
  children,
  className,
}: PanelProps) {
  const classes = [styles.panel, className].filter(Boolean).join(" ");
  return <Component className={classes}>{children}</Component>;
}
