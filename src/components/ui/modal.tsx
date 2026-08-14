"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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

function copyThemeStyle(from: HTMLElement | null): CSSProperties | undefined {
  if (!from) return undefined;
  const next: Record<string, string> = {};
  for (let index = 0; index < from.style.length; index += 1) {
    const name = from.style.item(index);
    if (!name) continue;
    next[name] = from.style.getPropertyValue(name);
  }
  return Object.keys(next).length ? (next as CSSProperties) : undefined;
}

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
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    }, 10);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
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
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const themeScope = document.querySelector<HTMLElement>("[data-room-theme]");

  return createPortal(
    <div
      className={styles.backdrop}
      data-room-theme={themeScope?.getAttribute("data-room-theme") ?? undefined}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onCloseRef.current();
        }
      }}
      role="presentation"
      style={copyThemeStyle(themeScope)}
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
            onClick={() => onCloseRef.current()}
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
