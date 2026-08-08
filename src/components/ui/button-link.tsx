import Link from "next/link";
import type { PropsWithChildren } from "react";

import styles from "@/components/ui/button.module.css";

type ButtonLinkProps = PropsWithChildren<{
  href: string;
  variant?: "default" | "primary" | "danger";
  className?: string;
}>;

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
