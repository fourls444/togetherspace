"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { readActiveRoomThemePortalProps } from "@/components/rooms/room-theme-provider";
import styles from "@/components/ui/date-field.module.css";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const MONTH_LABEL = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const DATE_LABEL = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function todayKey() {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function parseKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function formatThaiDate(value: string) {
  const parts = parseKey(value);
  if (!parts) return "";
  return DATE_LABEL.format(
    new Date(Date.UTC(parts.year, parts.month - 1, parts.day)),
  );
}

function monthCells(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );
}

function themeVars(style?: CSSProperties): CSSProperties {
  const vars: Record<string, string> = {};
  if (!style) return vars;
  for (const [name, value] of Object.entries(style)) {
    if (name.startsWith("--") && typeof value === "string") {
      vars[name] = value;
    }
  }
  return vars;
}

type DateFieldProps = {
  allowClear?: boolean;
  "aria-describedby"?: string;
  defaultValue?: string;
  disabled?: boolean;
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
};

/** ช่องวันที่แบบปฏิทินดรอปดาวน์ โทน Atelier ส่งค่า YYYY-MM-DD */
export function DateField({
  allowClear = true,
  "aria-describedby": describedBy,
  defaultValue = "",
  disabled = false,
  id,
  name,
  placeholder = "วว/ดด/ปปปป",
  required = false,
}: DateFieldProps) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [coords, setCoords] = useState({ left: 0, top: 0, width: 264 });
  const selected = parseKey(value);
  const initialView = selected ?? parseKey(todayKey())!;
  const [view, setView] = useState({
    year: initialView.year,
    month: initialView.month,
  });

  const cells = useMemo(
    () => monthCells(view.year, view.month),
    [view.month, view.year],
  );
  const monthTitle = MONTH_LABEL.format(
    new Date(Date.UTC(view.year, view.month - 1, 1)),
  );
  const today = todayKey();
  const portalTheme = mounted ? readActiveRoomThemePortalProps() : {};

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 264), window.innerWidth - 24);
      const height = popover?.offsetHeight ?? 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < height + 20 && rect.top > spaceBelow;
      const top = openUp ? rect.top - height - 8 : rect.bottom + 8;
      const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - width - 12,
      );
      setCoords({
        left,
        top: Math.max(12, top),
        width,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, view.month, view.year]);

  useEffect(() => {
    if (!open) return;
    let onPointer: ((event: PointerEvent) => void) | null = null;
    let onKey: ((event: KeyboardEvent) => void) | null = null;
    const timer = window.setTimeout(() => {
      onPointer = (event: PointerEvent) => {
        const target = event.target as Node;
        if (triggerRef.current?.contains(target)) return;
        if (popoverRef.current?.contains(target)) return;
        setOpen(false);
      };
      onKey = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      };
      document.addEventListener("pointerdown", onPointer);
      document.addEventListener("keydown", onKey, true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (onPointer) document.removeEventListener("pointerdown", onPointer);
      if (onKey) document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const shiftMonth = (delta: number) => {
    setView((current) => {
      const next = new Date(Date.UTC(current.year, current.month - 1 + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    });
  };

  const pick = (day: number) => {
    setValue(toDateKey(view.year, view.month, day));
    setOpen(false);
  };

  const onTriggerKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      const nextView = parseKey(value) ?? parseKey(todayKey())!;
      setView({ year: nextView.year, month: nextView.month });
      setOpen(true);
    }
  };

  const calendar = (
    <div
      aria-label="เลือกวันที่"
      className={styles.popover}
      data-room-theme={portalTheme["data-room-theme"]}
      id={popoverId}
      ref={popoverRef}
      role="dialog"
      style={{
        ...themeVars(portalTheme.style),
        left: coords.left,
        top: coords.top,
        width: coords.width,
      }}
    >
      <div className={styles.head}>
        <strong className={styles.month}>{monthTitle}</strong>
        <div className={styles.nav}>
          <button
            aria-label="เดือนก่อนหน้า"
            className={styles.navButton}
            onClick={() => shiftMonth(-1)}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="เดือนถัดไป"
            className={styles.navButton}
            onClick={() => shiftMonth(1)}
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div aria-hidden className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <span className={styles.weekday} key={day}>
            {day}
          </span>
        ))}
      </div>
      <div className={styles.days}>
        {cells.map((day, index) => {
          if (!day) {
            return <span className={styles.blank} key={`empty-${index}`} />;
          }
          const key = toDateKey(view.year, view.month, day);
          const className = [
            styles.day,
            key === today ? styles.today : "",
            key === value ? styles.selected : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              aria-current={key === today ? "date" : undefined}
              aria-pressed={key === value}
              className={className}
              key={key}
              onClick={() => pick(day)}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className={styles.foot}>
        <button
          className={styles.ghost}
          onClick={() => {
            const next = todayKey();
            const parts = parseKey(next)!;
            setView({ year: parts.year, month: parts.month });
            setValue(next);
            setOpen(false);
          }}
          type="button"
        >
          วันนี้
        </button>
        {allowClear && !required ? (
          <button
            className={styles.ghost}
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
            type="button"
          >
            ล้างวันที่
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <input name={name} type="hidden" value={value} />
      <button
        aria-controls={open ? popoverId : undefined}
        aria-describedby={describedBy}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={styles.trigger}
        data-empty={value ? "false" : "true"}
        disabled={disabled}
        id={id}
        onClick={() => {
          if (disabled) return;
          if (open) {
            setOpen(false);
            return;
          }
          const nextView = parseKey(value) ?? parseKey(todayKey())!;
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect) {
            const width = Math.min(
              Math.max(rect.width, 264),
              window.innerWidth - 24,
            );
            setCoords({
              left: Math.min(
                Math.max(12, rect.left),
                window.innerWidth - width - 12,
              ),
              top: rect.bottom + 8,
              width,
            });
          }
          setView({ year: nextView.year, month: nextView.month });
          setOpen(true);
        }}
        onKeyDown={onTriggerKey}
        ref={triggerRef}
        type="button"
      >
        <span>{value ? formatThaiDate(value) : placeholder}</span>
        <CalendarDays aria-hidden className={styles.icon} size={18} />
      </button>
      {mounted && open ? createPortal(calendar, document.body) : null}
    </div>
  );
}
