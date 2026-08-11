import { forwardRef, type ButtonHTMLAttributes } from "react";

import styles from "@/components/ui/button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
  pending?: boolean;
  pendingText?: string;
};

/** ปุ่มมาตรฐานของระบบ รองรับ ref เพื่อใช้จัดการ focus ใน dialog */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      disabled,
      pending = false,
      pendingText = "กำลังดำเนินการ…",
      type = "submit",
      variant = "default",
      ...props
    },
    ref,
  ) {
    const classes = [styles.button, styles[variant], className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        className={classes}
        disabled={disabled || pending}
        ref={ref}
        type={type}
        {...props}
      >
        {pending ? pendingText : children}
      </button>
    );
  },
);
