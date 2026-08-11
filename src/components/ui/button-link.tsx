import Link from "next/link";
import type { PropsWithChildren } from "react";

import styles from "@/components/ui/button.module.css";

type ButtonLinkProps = PropsWithChildren<{
  href: string;
  variant?: "default" | "primary" | "danger";
  className?: string;
  "aria-label"?: string;
  title?: string;
}>;

export function ButtonLink({
  children,
  href,
  variant = "default",
  className,
  "aria-label": ariaLabel,
  title,
}: ButtonLinkProps) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      aria-label={ariaLabel}
      className={classes}
      href={href}
      prefetch
      title={title}
    >
      {children}
    </Link>
  );
}
