import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMonthCalendar,
  formatDateKey,
  formatEventCountLabel,
  formatThaiCalendarPanelDate,
  getDayMarkerPreview,
  groupCalendarMarkersByDate,
  parseHolidayIcs,
  resolveSelectedCalendarDate,
} from "./calendar.ts";

test("builds a stable 6-week month grid", () => {
  const weeks = buildMonthCalendar(2026, 7);

  assert.equal(weeks.length, 6);
  assert.equal(formatDateKey(weeks[0][0].date), "2026-07-26");
  assert.equal(formatDateKey(weeks[1][6].date), "2026-08-08");
  assert.equal(weeks[1][6].isCurrentMonth, true);
  assert.equal(formatDateKey(weeks[5][6].date), "2026-09-05");
});

test("parses all-day Thai holiday events from Google Calendar ICS", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20260812",
    "SUMMARY:วันแม่แห่งชาติ",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20261013",
    "SUMMARY:วันคล้ายวันสวรรคต ร.9",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  assert.deepEqual(parseHolidayIcs(ics), [
    { date: "2026-08-12", title: "วันแม่แห่งชาติ" },
    { date: "2026-10-13", title: "วันคล้ายวันสวรรคต ร.9" },
  ]);
});

test("groups holidays and room events by date without event colors", () => {
  const grouped = groupCalendarMarkersByDate({
    events: [
      {
        id: "event-1",
        title: "กินข้าวเย็น",
        date: "2026-08-12",
      },
    ],
    holidays: [{ date: "2026-08-12", title: "วันแม่แห่งชาติ" }],
  });

  assert.deepEqual(grouped.get("2026-08-12"), {
    events: [
      {
        id: "event-1",
        title: "กินข้าวเย็น",
        date: "2026-08-12",
      },
    ],
    holidays: [{ date: "2026-08-12", title: "วันแม่แห่งชาติ" }],
  });
});

test("day marker preview shows holiday text by default without event dots", () => {
  const preview = getDayMarkerPreview({
    events: [
      {
        id: "event-1",
        title: "Dinner",
        date: "2026-08-12",
      },
      {
        id: "event-2",
        title: "Movie night",
        date: "2026-08-12",
      },
    ],
    holidays: [
      { date: "2026-08-12", title: "Mother's Day" },
      { date: "2026-08-12", title: "Substitute holiday" },
    ],
  });

  assert.deepEqual(
    preview.holidays.map((holiday) => holiday.title),
    ["Mother's Day"],
  );
  assert.equal(preview.events.length, 0);
  assert.equal(preview.extraCount, 3);
});

test("format event count label only when the date has events", () => {
  assert.equal(formatEventCountLabel(0), "");
  assert.equal(formatEventCountLabel(1), "1 กิจกรรม");
  assert.equal(formatEventCountLabel(2), "2 กิจกรรม");
});

test("month view defaults to today when current month is open", () => {
  assert.equal(
    resolveSelectedCalendarDate({
      requestedDate: undefined,
      monthStart: "2026-08-01",
      todayKey: "2026-08-11",
    }),
    "2026-08-11",
  );
});

test("month view defaults to the first day when another month is open", () => {
  assert.equal(
    resolveSelectedCalendarDate({
      requestedDate: undefined,
      monthStart: "2026-07-01",
      todayKey: "2026-08-11",
    }),
    "2026-07-01",
  );
});

test("year view defaults to today when current year is open", () => {
  assert.equal(
    resolveSelectedCalendarDate({
      requestedDate: undefined,
      monthStart: "2026-01-01",
      todayKey: "2026-08-11",
      view: "year",
    }),
    "2026-08-11",
  );
});

test("year view defaults to January 1 when another year is open", () => {
  assert.equal(
    resolveSelectedCalendarDate({
      requestedDate: undefined,
      monthStart: "2025-01-01",
      todayKey: "2026-08-11",
      view: "year",
    }),
    "2025-01-01",
  );
});

test("formats Thai panel date with a short Thursday label", () => {
  assert.equal(
    formatThaiCalendarPanelDate("2026-08-11"),
    "อังคาร 11 สิงหาคม 2569",
  );
  assert.equal(
    formatThaiCalendarPanelDate("2026-08-13"),
    "พฤหัส 13 สิงหาคม 2569",
  );
});
