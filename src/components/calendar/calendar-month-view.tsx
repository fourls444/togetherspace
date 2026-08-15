"use client";

import { useState } from "react";

import { CalendarEventModal } from "@/components/calendar/calendar-event-modal";
import styles from "@/components/calendar/calendar.module.css";
import {
  formatEventCountLabel,
  formatThaiCalendarPanelDate,
  type CalendarDayMarkers,
} from "@/lib/calendar/calendar";

export type CalendarMonthDayView = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  markers: CalendarDayMarkers;
  tooltip?: string;
};

type CalendarMonthViewProps = {
  initialSelectedDate: string;
  roomCode: string;
  roomId: string;
  weekdays: string[];
  weeks: CalendarMonthDayView[][];
};

function findSelectedMarkers(
  weeks: CalendarMonthDayView[][],
  selectedDate: string,
) {
  return (
    weeks.flat().find((day) => day.dateKey === selectedDate)?.markers ?? {
      events: [],
      holidays: [],
    }
  );
}

/** ปฏิทินรายเดือนที่เลือกวันและเปิดปิดแผงรายละเอียดได้โดยไม่เปลี่ยนหน้า */
export function CalendarMonthView({
  initialSelectedDate,
  roomCode,
  roomId,
  weekdays,
  weeks,
}: CalendarMonthViewProps) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [panelDate, setPanelDate] = useState<string | null>(null);
  const activeDate = panelDate ?? selectedDate;
  const dayMarkers = findSelectedMarkers(weeks, activeDate);

  /** เปิดรายละเอียดเมื่อกดวัน และปิดเมื่อกดวันเดิมซ้ำ */
  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey);
    setPanelDate((current) => (current === dateKey ? null : dateKey));
  }

  return (
    <div className={styles.monthArea}>
      <div
        className={`${styles.calendarShell} ${
          panelDate ? styles.calendarShellOpen : ""
        }`}
      >
        <section
          className={styles.grid}
          aria-label="ปฏิทินรายเดือน"
        >
          <div className={styles.weekdayRow}>
            {weekdays.map((weekday) => (
              <div className={styles.weekday} key={weekday}>
                {weekday}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div className={styles.week} key={week[0].dateKey}>
              {week.map((day) => (
                <MonthDayButton
                  day={day}
                  key={day.dateKey}
                  selected={day.dateKey === selectedDate}
                  onSelect={handleSelectDate}
                />
              ))}
            </div>
          ))}
        </section>

        {panelDate ? (
          <aside className={styles.panel} aria-label="รายการของวันที่เลือก">
            <div className={styles.panelHead}>
              <div>
                <h2 className={styles.panelTitle}>
                  {formatThaiCalendarPanelDate(activeDate)}
                </h2>
                <p className={styles.panelMeta}>
                  {dayMarkers.holidays.length
                    ? "วันสำคัญของไทยในวันนี้"
                    : "วันนี้ไม่มีวันสำคัญของไทย"}
                </p>
              </div>
            </div>

            {dayMarkers.holidays.length ? (
              <section>
                <h3 className={styles.sectionTitle}>วันสำคัญ</h3>
                <ul className={styles.list}>
                  {dayMarkers.holidays.map((holiday) => (
                    <li className={styles.listItem} key={holiday.title}>
                      <p className={styles.itemTitle}>{holiday.title}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h3 className={styles.sectionTitle}>เพิ่มกิจกรรม</h3>
              <CalendarEventModal
                defaultDate={activeDate}
                roomCode={roomCode}
                roomId={roomId}
              />
            </section>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function MonthDayButton({
  day,
  onSelect,
  selected,
}: {
  day: CalendarMonthDayView;
  onSelect: (dateKey: string) => void;
  selected: boolean;
}) {
  const visibleHoliday = day.markers.holidays.at(0);
  const hiddenHolidayCount = Math.max(
    0,
    day.markers.holidays.length - (visibleHoliday ? 1 : 0),
  );
  const eventCountLabel = formatEventCountLabel(day.markers.events.length);

  return (
    <button
      className={[
        styles.day,
        day.isCurrentMonth ? "" : styles.dayMuted,
        eventCountLabel ? styles.dayHasEvents : "",
        selected ? styles.daySelected : "",
        day.isToday ? styles.dayToday : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-tooltip={day.tooltip}
      onClick={() => onSelect(day.dateKey)}
      title={day.tooltip}
      type="button"
    >
      <span className={styles.dayNumber}>{day.dayNumber}</span>
      <span className={styles.monthMarkers}>
        {visibleHoliday ? (
          <span className={styles.monthHolidayText}>
            {visibleHoliday.title}
            {hiddenHolidayCount > 0 ? ` +${hiddenHolidayCount}` : ""}
          </span>
        ) : null}
        {eventCountLabel ? (
          <span className={styles.monthEventCount}>{eventCountLabel}</span>
        ) : null}
      </span>
    </button>
  );
}
