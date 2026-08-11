"use client";

import { useMemo, useState } from "react";

import { CalendarEventModal } from "@/components/calendar/calendar-event-modal";
import { CalendarEventEditor } from "@/components/calendar/calendar-event-editor";
import styles from "@/components/calendar/calendar.module.css";
import {
  formatEventCountLabel,
  formatThaiCalendarPanelDate,
  type CalendarDayMarkers,
  type CalendarEventMarker,
} from "@/lib/calendar/calendar";

export type CalendarMonthDayView = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  markers: CalendarDayMarkers;
  tooltip?: string;
};

export type CalendarEventDetailView = CalendarEventMarker & {
  description: string | null;
};

type CalendarMonthViewProps = {
  eventDetails: CalendarEventDetailView[];
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
  eventDetails,
  initialSelectedDate,
  roomCode,
  roomId,
  weekdays,
  weeks,
}: CalendarMonthViewProps) {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [panelDate, setPanelDate] = useState<string | null>(null);
  const detailById = useMemo(
    () => new Map(eventDetails.map((event) => [event.id, event])),
    [eventDetails],
  );
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
                    ? "วันสำคัญและกิจกรรมที่เพิ่มไว้ในห้องนี้"
                    : "กิจกรรมที่เพิ่มไว้ในห้องนี้"}
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
              <h3 className={styles.sectionTitle}>กิจกรรมของห้อง</h3>
              {dayMarkers.events.length ? (
                <ul className={styles.list}>
                  {dayMarkers.events.map((event) => {
                    const detail = detailById.get(event.id);

                    return (
                      <li className={styles.listItem} key={event.id}>
                        <p className={styles.itemTitle}>{event.title}</p>
                        {detail?.description ? (
                          <p className={styles.itemText}>
                            {detail.description}
                          </p>
                        ) : null}
                        {detail ? (
                          <CalendarEventEditor
                            event={detail}
                            roomCode={roomCode}
                            roomId={roomId}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={styles.empty}>ยังไม่มีกิจกรรมในวันนี้</p>
              )}
            </section>

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
