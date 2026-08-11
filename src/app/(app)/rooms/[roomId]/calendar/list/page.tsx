import { CalendarEventEditor } from "@/components/calendar/calendar-event-editor";
import styles from "@/components/calendar/calendar.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import {
  fetchThaiHolidays,
  formatDateKey,
} from "@/lib/calendar/calendar";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

const MONTH_TITLE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "full",
  timeZone: "UTC",
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

function getMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function formatMonthTitle(year: number, monthIndex: number) {
  return MONTH_TITLE_FORMATTER.format(createUtcDate(year, monthIndex, 1));
}

function formatFullDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return FULL_DATE_FORMATTER.format(createUtcDate(year, month - 1, day));
}

/** รายการกิจกรรมและวันสำคัญของเดือนที่เลือก */
export default async function CalendarMonthListPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ month?: string | string[] }>;
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
          description="ถ้าต้องการดูรายการกิจกรรม กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  const now = new Date();
  const parsedMonth = parseMonthParam(query.month);
  const year = parsedMonth?.year ?? now.getFullYear();
  const monthIndex = parsedMonth?.monthIndex ?? now.getMonth();
  const monthKey = getMonthKey(year, monthIndex);
  const monthStart = formatDateKey(createUtcDate(year, monthIndex, 1));
  const monthEnd = formatDateKey(createUtcDate(year, monthIndex + 1, 0));
  const calendarHref = `${getRoomSubPath(context.roomCode, "calendar")}?month=${monthKey}`;

  const [holidays, eventsResult] = await Promise.all([
    fetchThaiHolidays(),
    context.supabase
      .from("calendar_events")
      .select("id, title, description, event_date")
      .eq("room_id", context.roomId)
      .gte("event_date", monthStart)
      .lte("event_date", monthEnd)
      .order("event_date")
      .order("created_at"),
  ]);

  const events = eventsResult.data ?? [];
  const visibleHolidays = holidays.filter(
    (holiday) => holiday.date >= monthStart && holiday.date <= monthEnd,
  );

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <div>
          <p className={styles.panelMeta}>รายการกิจกรรมของเดือน</p>
          <h1 className={styles.monthTitle}>
            {formatMonthTitle(year, monthIndex)}
          </h1>
        </div>
        <ButtonLink href={calendarHref}>กลับปฏิทิน</ButtonLink>
      </div>

      <section className={styles.monthListLayout}>
        <article className={styles.panel}>
          <h2 className={styles.sectionTitle}>กิจกรรมของห้อง</h2>
          {events.length ? (
            <ul className={styles.list}>
              {events.map((event) => (
                <li className={styles.listItem} key={event.id}>
                  <div className={styles.itemHead}>
                    <div>
                      <p className={styles.itemTitle}>{event.title}</p>
                      <p className={styles.itemText}>
                        {formatFullDate(event.event_date)}
                      </p>
                    </div>
                  </div>
                  {event.description ? (
                    <p className={styles.itemText}>{event.description}</p>
                  ) : null}
                  <CalendarEventEditor
                    event={{
                      id: event.id,
                      title: event.title,
                      date: event.event_date,
                      description: event.description,
                    }}
                    roomCode={context.roomCode}
                    roomId={context.roomId}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>ยังไม่มีกิจกรรมในเดือนนี้</p>
          )}
        </article>

        <article className={styles.panel}>
          <h2 className={styles.sectionTitle}>วันสำคัญ</h2>
          {visibleHolidays.length ? (
            <ul className={styles.list}>
              {visibleHolidays.map((holiday) => (
                <li className={styles.listItem} key={holiday.title}>
                  <p className={styles.itemTitle}>{holiday.title}</p>
                  <p className={styles.itemText}>
                    {formatFullDate(holiday.date)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>เดือนนี้ไม่มีวันสำคัญจาก calendar</p>
          )}
        </article>
      </section>
    </div>
  );
}
