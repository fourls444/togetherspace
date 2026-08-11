export const THAI_HOLIDAY_ICS_URL =
  "https://calendar.google.com/calendar/ical/th.th%23holiday%40group.v.calendar.google.com/public/basic.ics";

export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

export type CalendarEventMarker = {
  id: string;
  title: string;
  date: string;
};

export type HolidayMarker = {
  date: string;
  title: string;
};

export type CalendarDayMarkers = {
  events: CalendarEventMarker[];
  holidays: HolidayMarker[];
};

export type CalendarDayPreview = {
  events: CalendarEventMarker[];
  holidays: HolidayMarker[];
  extraCount: number;
};

const THAI_PANEL_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  timeZone: "UTC",
  weekday: "long",
});
const THAI_PANEL_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

/** เลือกสีตัวอักษรอ่อนหรือเข้มตามความสว่างของสีพื้นกิจกรรม */
/** แปลง Date เป็น key แบบ YYYY-MM-DD โดยใช้ UTC เพื่อลดปัญหา timezone บน server */
export function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** แสดงวันที่ใน panel รายวันให้อ่านง่าย เช่น อังคาร 11 สิงหาคม 2569 */
export function formatThaiCalendarPanelDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = THAI_PANEL_WEEKDAY_FORMATTER.format(date)
    .replace(/^วัน/, "")
    .replace("พฤหัสบดี", "พฤหัส");

  return `${weekday} ${THAI_PANEL_DATE_FORMATTER.format(date)}`;
}

/** เลือกวันที่เริ่มต้นของปฏิทิน โดยให้เดือนปัจจุบันเริ่มที่วันนี้ และเดือนอื่นเริ่มที่วันแรก */
/** คืนข้อความจำนวนกิจกรรมแบบสั้นสำหรับแสดงบนช่องวันที่มีพื้นที่จำกัด */
export function formatEventCountLabel(count: number) {
  return count > 0 ? `${count} กิจกรรม` : "";
}

export function resolveSelectedCalendarDate({
  monthStart,
  requestedDate,
  todayKey,
  view = "month",
}: {
  monthStart: string;
  requestedDate: string | string[] | undefined;
  todayKey: string;
  view?: "month" | "year";
}) {
  if (
    typeof requestedDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
  ) {
    return requestedDate;
  }

  const compareLength = view === "year" ? 4 : 7;

  return todayKey.slice(0, compareLength) ===
    monthStart.slice(0, compareLength)
    ? todayKey
    : monthStart;
}

/** สร้าง Date แบบ UTC จากวันที่ เพื่อให้ grid ปฏิทินนิ่งไม่ขึ้นกับ timezone เครื่อง */
function createUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

/** สร้าง grid รายเดือน 6 แถว x 7 วัน โดยเริ่มวันอาทิตย์ */
export function buildMonthCalendar(year: number, monthIndex: number) {
  const firstDay = createUtcDate(year, monthIndex, 1);
  const startOffset = firstDay.getUTCDay();
  const startDate = createUtcDate(year, monthIndex, 1 - startOffset);

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = createUtcDate(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate() + weekIndex * 7 + dayIndex,
      );

      return {
        date,
        isCurrentMonth: date.getUTCMonth() === monthIndex,
      };
    }),
  );
}

/** แปลงวันที่แบบ YYYYMMDD จาก ICS เป็น YYYY-MM-DD */
function parseIcsDate(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** รวมบรรทัด ICS ที่ถูก fold ตาม spec ให้กลับมาเป็น field เดียว */
function unfoldIcsLines(icsText: string) {
  return icsText
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/);
}

/** decode ข้อความพื้นฐานจาก ICS เช่น comma/newline ที่ถูก escape */
function decodeIcsText(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** parse Google Holiday ICS ให้เหลือวันสำคัญแบบ all-day ที่ใช้แสดงบนปฏิทิน */
export function parseHolidayIcs(icsText: string): HolidayMarker[] {
  const holidays: HolidayMarker[] = [];
  let inEvent = false;
  let date: string | null = null;
  let title: string | null = null;

  for (const line of unfoldIcsLines(icsText)) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      date = null;
      title = null;
      continue;
    }

    if (line === "END:VEVENT") {
      if (inEvent && date && title) holidays.push({ date, title });
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    if (line.startsWith("DTSTART")) {
      const rawDate = line.split(":").at(1);
      date = rawDate ? parseIcsDate(rawDate) : null;
    }

    if (line.startsWith("SUMMARY:")) {
      title = decodeIcsText(line.slice("SUMMARY:".length));
    }
  }

  return holidays;
}

/** โหลดวันสำคัญไทยจาก Google Holiday Calendar แบบไม่ใช้ API key และ cache โดย Next.js */
export async function fetchThaiHolidays() {
  const response = await fetch(THAI_HOLIDAY_ICS_URL, {
    next: { revalidate: 86_400 },
  });

  if (!response.ok) return [];

  return parseHolidayIcs(await response.text());
}

/** รวมวันสำคัญและกิจกรรมตาม date key เพื่อให้ UI render marker ได้ง่าย */
export function groupCalendarMarkersByDate({
  events,
  holidays,
}: {
  events: CalendarEventMarker[];
  holidays: HolidayMarker[];
}) {
  const grouped = new Map<string, CalendarDayMarkers>();

  function ensure(date: string) {
    const existing = grouped.get(date);
    if (existing) return existing;

    const markers = { events: [], holidays: [] };
    grouped.set(date, markers);
    return markers;
  }

  for (const holiday of holidays) {
    ensure(holiday.date).holidays.push(holiday);
  }

  for (const event of events) {
    ensure(event.date).events.push(event);
  }

  return grouped;
}

/** เลือก marker ที่จะแสดงบนช่องวัน โดยใช้ชื่อวันสำคัญจริงและนับรายการที่ซ่อนอยู่ */
export function getDayMarkerPreview(
  markers: CalendarDayMarkers,
  options: { eventLimit?: number; holidayLimit?: number } = {},
): CalendarDayPreview {
  const eventLimit = options.eventLimit ?? 0;
  const holidayLimit = options.holidayLimit ?? 1;
  const events = markers.events.slice(0, eventLimit);
  const holidays = markers.holidays.slice(0, holidayLimit);
  const extraCount =
    markers.events.length +
    markers.holidays.length -
    events.length -
    holidays.length;

  return {
    events,
    holidays,
    extraCount: Math.max(0, extraCount),
  };
}
