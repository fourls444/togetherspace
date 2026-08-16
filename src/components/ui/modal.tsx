"use client";

import {
  useEffect,
  useId,
  useRef,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { readActiveRoomThemePortalProps } from "@/components/rooms/room-theme-provider";

import styles from "./modal.module.css";

type ModalProps = PropsWithChildren<{
  closeOnBackdrop?: boolean;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  title: string;
}>;

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** คอมโพเนนต์ Modal อเนกประสงค์ ควบคุม focus และกด ESC เพื่อปิด */
export function Modal({
  children,
  closeOnBackdrop = false,
  description,
  isOpen,
  onClose,
  size = "md",
  title,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ตั้งเวลาให้ focus แต่อย่าให้ focus ดึงจอไปถ้ามี input (เดี๋ยวค่อยจัดการใน form)
    setTimeout(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    }, 10);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
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
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const portalTheme = readActiveRoomThemePortalProps();

  return createPortal(
    <div
      className={styles.backdrop}
      data-room-theme={portalTheme["data-room-theme"]}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
      role="presentation"
      style={portalTheme.style}
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.modal}
        data-size={size}
        ref={modalRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className={styles.description} id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="ปิด"
            className={styles.closeButton}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X size={20} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
