"use client";

import { useRouter } from "next/navigation";

import styles from "@/components/calendar/calendar.module.css";

type CalendarPeriodOption = {
  label: string;
  value: string;
};

type CalendarPeriodSelectProps = {
  basePath: string;
  label: string;
  options: CalendarPeriodOption[];
  value: string;
  view: "month" | "year";
};

/** เปลี่ยนเดือนหรือปีทันทีเมื่อผู้ใช้เลือกจาก dropdown */
export function CalendarPeriodSelect({
  basePath,
  label,
  options,
  value,
  view,
}: CalendarPeriodSelectProps) {
  const router = useRouter();

  function navigateToPeriod(nextValue: string) {
    const params = new URLSearchParams({ month: nextValue });
    if (view === "year") params.set("view", "year");

    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className={styles.periodSelectLabel}>
      <span className={styles.srOnly}>{label}</span>
      <select
        className={styles.periodSelect}
        defaultValue={value}
        onChange={(event) => navigateToPeriod(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
