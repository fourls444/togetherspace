"use client";

import { useEffect } from "react";

import styles from "./toast.module.css";

export type ToastProps = {
  duration?: number;
  message: string | null;
  onDismiss: () => void;
  tone?: "success" | "error";
};

/** แสดงข้อความตอบกลับชั่วคราวโดยไม่รบกวน flow ของหน้าปัจจุบัน */
export function Toast({
  duration = 2600,
  message,
  onDismiss,
  tone = "success",
}: ToastProps) {
  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`${styles.toast} ${styles[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
