import Link from "next/link";
import type { PropsWithChildren } from "react";

import styles from "@/components/ui/button.module.css";

type ButtonLinkProps = PropsWithChildren<{
  href: string;
  variant?: "default" | "primary";
  className?: string;
}>;

/** แสดงลิงก์นำทางด้วยรูปลักษณ์เดียวกับปุ่มโดยยังคง semantics ของ Link */
export function ButtonLink({
  children,
  href,
  variant = "default",
  className,
}: ButtonLinkProps) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={classes} href={href}>
      {children}
    </Link>
  );
}
