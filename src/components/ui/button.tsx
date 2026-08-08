import type { ButtonHTMLAttributes } from "react";

import styles from "@/components/ui/button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
  pending?: boolean;
  pendingText?: string;
};

export function Button({
  children,
  className,
  disabled,
  pending = false,
  pendingText = "กำลังดำเนินการ…",
  type = "submit",
  variant = "default",
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || pending}
      type={type}
      {...props}
    >
      {pending ? pendingText : children}
    </button>
  );
}
