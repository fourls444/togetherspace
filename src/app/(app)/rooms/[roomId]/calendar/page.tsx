import {
  CalendarMonthView,
  type CalendarMonthDayView,
} from "@/components/calendar/calendar-month-view";
import { CalendarPeriodSelect } from "@/components/calendar/calendar-period-select";
import styles from "@/components/calendar/calendar.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import {
  buildMonthCalendar,
  fetchThaiHolidays,
  formatDateKey,
  groupCalendarMarkersByDate,
  resolveSelectedCalendarDate,
  type CalendarDayMarkers,
  type CalendarEventMarker,
} from "@/lib/calendar/calendar";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  timeZone: "UTC",
});
const MONTH_TITLE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const YEAR_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  timeZone: "UTC",
  year: "numeric",
});
function createUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function parseMonthParam(value: string | string[] | undefined) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  return { year, monthIndex };
}

function parseViewParam(value: string | string[] | undefined) {
  return value === "year" ? "year" : "month";
}

function getMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getMonthHref(roomCode: string, year: number, monthIndex: number) {
  return `${getRoomSubPath(roomCode, "calendar")}?month=${getMonthKey(
    year,
    monthIndex,
  )}`;
}

function getYearHref(roomCode: string, year: number) {
  return `${getRoomSubPath(roomCode, "calendar")}?month=${year}-01&view=year`;
}

function getDayHref(roomCode: string, dateKey: string) {
  return `${getRoomSubPath(roomCode, "calendar")}?month=${dateKey.slice(
    0,
    7,
  )}&date=${dateKey}`;
}

function formatMonthTitle(year: number, monthIndex: number) {
  return MONTH_TITLE_FORMATTER.format(createUtcDate(year, monthIndex, 1));
}

function formatYearTitle(year: number) {
  return YEAR_FORMATTER.format(createUtcDate(year, 0, 1));
}

function formatMonthName(year: number, monthIndex: number) {
  return MONTH_FORMATTER.format(createUtcDate(year, monthIndex, 1));
}

function markerTooltip(marker: CalendarDayMarkers | undefined) {
  if (!marker) return undefined;

  const labels = [
    ...marker.holidays.map((holiday) => holiday.title),
    ...marker.events.map((event) => event.title),
  ];

  return labels.length ? labels.join("\n") : undefined;
}

function getPeriodOptions(year: number, view: "month" | "year") {
  if (view === "year") {
    return Array.from({ length: 21 }, (_, index) => year - 10 + index).map(
      (optionYear) => ({
        label: formatYearTitle(optionYear),
        value: `${optionYear}-01`,
      }),
    );
  }

  return Array.from({ length: 12 }, (_, optionMonth) => ({
    label: formatMonthName(year, optionMonth),
    value: getMonthKey(year, optionMonth),
  }));
}

function buildMonthDayView({
  markers,
  todayKey,
  weeks,
}: {
  markers: Map<string, CalendarDayMarkers>;
  todayKey: string;
  weeks: ReturnType<typeof buildMonthCalendar>;
}): CalendarMonthDayView[][] {
  return weeks.map((week) =>
    week.map((day) => {
      const dateKey = formatDateKey(day.date);
      const dayMarkers = markers.get(dateKey) ?? { events: [], holidays: [] };

      return {
        dateKey,
        dayNumber: day.date.getUTCDate(),
        isCurrentMonth: day.isCurrentMonth,
        isToday: dateKey === todayKey,
        markers: dayMarkers,
        tooltip: markerTooltip(dayMarkers),
      };
    }),
  );
}

/** ปฏิทินห้อง — วันสำคัญไทยจาก Google Holiday ICS + กิจกรรมสีของห้อง */
export default async function RoomCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{
    date?: string | string[];
    month?: string | string[];
    view?: string | string[];
  }>;
}) {
  const [{ roomId: roomSlug }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.panel}>
        <ErrorState
          description="ถ้าต้องการดูปฏิทินนี้ กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  const now = new Date();
  const parsedMonth = parseMonthParam(query.month);
  const view = parseViewParam(query.view);
  const year = parsedMonth?.year ?? now.getFullYear();
  const monthIndex = parsedMonth?.monthIndex ?? now.getMonth();
  const monthStart = formatDateKey(createUtcDate(year, monthIndex, 1));
  const monthEnd = formatDateKey(createUtcDate(year, monthIndex + 1, 0));
  const rangeStart = view === "year" ? `${year}-01-01` : monthStart;
  const rangeEnd = view === "year" ? `${year}-12-31` : monthEnd;
  const todayKey = formatDateKey(now);
  const selectedDate = resolveSelectedCalendarDate({
    monthStart,
    requestedDate: query.date,
    todayKey,
    view,
  });
  const weeks = buildMonthCalendar(year, monthIndex);

  const [holidays, eventsResult] = await Promise.all([
    fetchThaiHolidays(),
    context.supabase
      .from("calendar_events")
      .select("id, title, description, event_date")
      .eq("room_id", context.roomId)
      .gte("event_date", rangeStart)
      .lte("event_date", rangeEnd)
      .order("event_date")
      .order("created_at"),
  ]);

  const events: CalendarEventMarker[] = (eventsResult.data ?? []).map(
    (event) => ({
      id: event.id,
      title: event.title,
      date: event.event_date,
    }),
  );
  const visibleHolidayDates =
    view === "year"
      ? null
      : new Set(weeks.flat().map((day) => formatDateKey(day.date)));
  const visibleHolidays = holidays.filter((holiday) => {
    if (view === "year") {
      return holiday.date >= rangeStart && holiday.date <= rangeEnd;
    }

    return visibleHolidayDates?.has(holiday.date);
  });
  const markers = groupCalendarMarkersByDate({
    events,
    holidays: visibleHolidays,
  });
  const monthWeeks = buildMonthDayView({
    markers,
    todayKey,
    weeks,
  });
  const periodOptions = getPeriodOptions(year, view);

  const previousMonth = createUtcDate(year, monthIndex - 1, 1);
  const nextMonth = createUtcDate(year, monthIndex + 1, 1);

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <div>
          <p className={styles.panelMeta}>ปฏิทินของห้อง</p>
          <h2
            className={`${styles.monthTitle} ${view === "year" ? styles.yearTitle : ""}`}
          >
            {view === "year"
              ? `ปฏิทินทั้งปี ${formatYearTitle(year)}`
              : formatMonthTitle(year, monthIndex)}
          </h2>
        </div>
        <div className={styles.calendarControls}>
          <CalendarPeriodSelect
            basePath={getRoomSubPath(context.roomCode, "calendar")}
            label={view === "year" ? "เลือกปี" : "เลือกเดือน"}
            options={periodOptions}
            value={
              view === "year" ? `${year}-01` : getMonthKey(year, monthIndex)
            }
            view={view}
          />
          {view === "month" ? (
            <ButtonLink
              href={`${getRoomSubPath(context.roomCode, "calendar")}/list?month=${getMonthKey(year, monthIndex)}`}
            >
              กิจกรรมและวันสำคัญเดือนนี้
            </ButtonLink>
          ) : null}
          <div className={styles.viewSwitch} aria-label="สลับมุมมองปฏิทิน">
            <ButtonLink
              className={view === "month" ? styles.viewSwitchActive : ""}
              href={
                view === "year"
                  ? getDayHref(context.roomCode, selectedDate)
                  : getMonthHref(context.roomCode, year, monthIndex)
              }
            >
              รายเดือน
            </ButtonLink>
            <ButtonLink
              className={view === "year" ? styles.viewSwitchActive : ""}
              href={getYearHref(context.roomCode, year)}
            >
              ทั้งปี
            </ButtonLink>
          </div>
          <div className={styles.monthNav}>
            <ButtonLink
              aria-label={view === "year" ? "ปีก่อน" : "เดือนก่อน"}
              href={
                view === "year"
                  ? getYearHref(context.roomCode, year - 1)
                  : getMonthHref(
                      context.roomCode,
                      previousMonth.getUTCFullYear(),
                      previousMonth.getUTCMonth(),
                    )
              }
              title={view === "year" ? "ปีก่อน" : "เดือนก่อน"}
            >
              ‹
            </ButtonLink>
            <ButtonLink
              aria-label={view === "year" ? "ปีถัดไป" : "เดือนถัดไป"}
              href={
                view === "year"
                  ? getYearHref(context.roomCode, year + 1)
                  : getMonthHref(
                      context.roomCode,
                      nextMonth.getUTCFullYear(),
                      nextMonth.getUTCMonth(),
                    )
              }
              title={view === "year" ? "ปีถัดไป" : "เดือนถัดไป"}
            >
              ›
            </ButtonLink>
          </div>
        </div>
      </div>

      {view === "year" ? (
        <YearOverview
          markers={markers}
          roomCode={context.roomCode}
          selectedDate={selectedDate}
          todayKey={todayKey}
          year={year}
        />
      ) : null}

      {view === "month" ? (
        <CalendarMonthView
          initialSelectedDate={selectedDate}
          key={getMonthKey(year, monthIndex)}
          roomCode={context.roomCode}
          roomId={context.roomId}
          weekdays={WEEKDAYS}
          weeks={monthWeeks}
        />
      ) : null}
    </div>
  );
}

function YearOverview({
  markers,
  roomCode,
  selectedDate,
  todayKey,
  year,
}: {
  markers: Map<string, CalendarDayMarkers>;
  roomCode: string;
  selectedDate: string;
  todayKey: string;
  year: number;
}) {
  return (
    <section className={styles.yearGrid} aria-label="ปฏิทินรายปี">
      {Array.from({ length: 12 }, (_, monthIndex) => {
        const weeks = buildMonthCalendar(year, monthIndex);

        return (
          <article className={styles.yearMonth} key={monthIndex}>
            <a
              className={styles.yearMonthTitle}
              href={getMonthHref(roomCode, year, monthIndex)}
            >
              {formatMonthName(year, monthIndex)}
            </a>
            <div className={styles.yearWeekdays} aria-hidden>
              {WEEKDAYS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className={styles.yearDays}>
              {weeks.flat().map((day) => {
                const dateKey = formatDateKey(day.date);
                if (!day.isCurrentMonth) {
                  return (
                    <span
                      aria-hidden
                      className={`${styles.yearDay} ${styles.yearDayMuted}`}
                      key={`${monthIndex}-${dateKey}`}
                    />
                  );
                }

                const marker = markers.get(dateKey);
                const tooltip = markerTooltip(marker);
                const hasHoliday = Boolean(marker?.holidays.length);
                const hasEvent = Boolean(marker?.events.length);

                return (
                  <a
                    aria-label={tooltip ?? dateKey}
                    className={[
                      styles.yearDay,
                      day.isCurrentMonth ? "" : styles.yearDayMuted,
                      hasEvent ? styles.yearDayHasEvents : "",
                      dateKey === selectedDate ? styles.yearDaySelected : "",
                      dateKey === todayKey ? styles.yearDayToday : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-tooltip={tooltip}
                    href={getDayHref(roomCode, dateKey)}
                    key={`${monthIndex}-${dateKey}`}
                    title={tooltip}
                  >
                    <span>{day.date.getUTCDate()}</span>
                    {hasHoliday ? (
                      <i className={styles.yearHolidayLine} aria-hidden />
                    ) : null}
                  </a>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
