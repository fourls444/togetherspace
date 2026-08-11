import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMonthCalendar,
  formatDateKey,
  formatThaiCalendarPanelDate,
  getCalendarEventForeground,
  getDayMarkerPreview,
  groupCalendarMarkersByDate,
  parseHolidayIcs,
  resolveSelectedCalendarDate,
} from "./calendar.ts";
import { CALENDAR_EVENT_COLORS } from "../../features/calendar/validation.ts";

test("สร้าง calendar grid เดือนสิงหาคม 2026 พร้อมวันจากเดือนข้างเคียง", () => {
  const weeks = buildMonthCalendar(2026, 7);

  assert.equal(weeks.length, 6);
  assert.equal(formatDateKey(weeks[0][0].date), "2026-07-26");
  assert.equal(formatDateKey(weeks[1][6].date), "2026-08-08");
  assert.equal(weeks[1][6].isCurrentMonth, true);
  assert.equal(formatDateKey(weeks[5][6].date), "2026-09-05");
});

test("parse Google Holiday ICS เป็นรายการวันสำคัญแบบ all-day", () => {
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

test("group marker ของวันสำคัญและกิจกรรมตามวันที่", () => {
  const grouped = groupCalendarMarkersByDate({
    events: [
      {
        id: "event-1",
        title: "กินข้าวเย็น",
        date: "2026-08-12",
        color: "#E8A055",
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
        color: "#E8A055",
      },
    ],
    holidays: [{ date: "2026-08-12", title: "วันแม่แห่งชาติ" }],
  });
});

test("day marker preview uses the real holiday title and counts hidden rows", () => {
  const preview = getDayMarkerPreview({
    events: [
      {
        id: "event-1",
        title: "Dinner",
        date: "2026-08-12",
        color: "#E8A055",
      },
      {
        id: "event-2",
        title: "Movie night",
        date: "2026-08-12",
        color: "#8EC5FF",
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
  assert.equal(preview.events.length, 2);
  assert.equal(preview.extraCount, 1);
});

test("ชุดสีกิจกรรมมีสีสด 10 สี พร้อมสีดำและสีขาว", () => {
  assert.equal(CALENDAR_EVENT_COLORS.length, 10);
  assert.equal(new Set(CALENDAR_EVENT_COLORS).size, 10);
  assert.ok(CALENDAR_EVENT_COLORS.includes("#111827"));
  assert.ok(CALENDAR_EVENT_COLORS.includes("#F8FAFC"));
});

test("เลือกสีข้อความที่อ่านชัดบนพื้นกิจกรรมสีเข้มและสีอ่อน", () => {
  assert.equal(getCalendarEventForeground("#111827"), "#F8FAFC");
  assert.equal(getCalendarEventForeground("#F8FAFC"), "#111827");
  assert.equal(getCalendarEventForeground("#FACC15"), "#111827");
});

test("เปิดเดือนปัจจุบันโดยไม่มีวันที่ใน URL แล้วเลือกวันนี้เป็นค่าเริ่มต้น", () => {
  assert.equal(
    resolveSelectedCalendarDate({
      requestedDate: undefined,
      monthStart: "2026-08-01",
      todayKey: "2026-08-11",
    }),
    "2026-08-11",
  );
});

test("เปิดเดือนอื่นโดยไม่มีวันที่ใน URL แล้วยังเริ่มที่วันแรกของเดือนนั้น", () => {
  assert.equal(
    resolveSelectedCalendarDate({
      requestedDate: undefined,
      monthStart: "2026-07-01",
      todayKey: "2026-08-11",
    }),
    "2026-07-01",
  );
});

test("เปิดรายปีของปีปัจจุบันโดยไม่มีวันที่ใน URL แล้วเลือกวันนี้เป็นค่าเริ่มต้น", () => {
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

test("เปิดรายปีของปีอื่นโดยไม่มีวันที่ใน URL แล้วยังเริ่มที่วันแรกของปีนั้น", () => {
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

test("ถ้า URL ระบุวันที่ถูกต้อง ให้ใช้วันที่จาก URL ก่อน", () => {
  assert.equal(
    resolveSelectedCalendarDate({
      requestedDate: "2026-08-20",
      monthStart: "2026-08-01",
      todayKey: "2026-08-11",
    }),
    "2026-08-20",
  );
});

test("แสดงวันที่ใน panel เป็นรูปแบบวันสั้น วันที่ เดือนเต็ม ปี", () => {
  assert.equal(
    formatThaiCalendarPanelDate("2026-08-11"),
    "อังคาร 11 สิงหาคม 2569",
  );
});

test("ย่อวันพฤหัสบดีใน panel เป็นพฤหัส", () => {
  assert.equal(
    formatThaiCalendarPanelDate("2026-01-01"),
    "พฤหัส 1 มกราคม 2569",
  );
});
