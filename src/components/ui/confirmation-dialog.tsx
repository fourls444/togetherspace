"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

import styles from "./confirmation-dialog.module.css";

export type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  variant?: "primary" | "danger";
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** แสดงกล่องยืนยันมาตรฐานและกัก focus ไว้ในกล่องระหว่างเปิดใช้งาน */
export function ConfirmationDialog({
  cancelLabel = "ยกเลิก",
  confirmLabel,
  description,
  isPending = false,
  onCancel,
  onConfirm,
  open,
  title,
  variant = "primary",
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    /** ปิด dialog ด้วย Escape และวน focus ไม่ให้ออกนอกกล่อง */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isPending, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onCancel();
      }}
      role="presentation"
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
      >
        <h2 className={styles.title} id={titleId}>
          {title}
        </h2>
        <p className={styles.description} id={descriptionId}>
          {description}
        </p>
        <div className={styles.actions}>
          <Button
            disabled={isPending}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            pending={isPending}
            pendingText="กำลังดำเนินการ…"
            type="button"
            variant={variant}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
