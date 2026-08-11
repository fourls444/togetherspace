import assert from "node:assert/strict";
import test from "node:test";

import {
  deleteCalendarEventSchema,
  updateCalendarEventSchema,
} from "./validation.ts";

const validEvent = {
  roomId: "11111111-1111-4111-8111-111111111111",
  roomCode: "123456",
  eventId: "22222222-2222-4222-8222-222222222222",
  title: "Dinner",
  description: "",
  eventDate: "2026-08-11",
  color: "#F97316",
};

test("update calendar event validates event id and trims optional description", () => {
  const result = updateCalendarEventSchema.safeParse(validEvent);

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.description, null);
});

test("delete calendar event requires event id and room identity", () => {
  assert.equal(deleteCalendarEventSchema.safeParse(validEvent).success, true);
  assert.equal(
    deleteCalendarEventSchema.safeParse({
      roomId: validEvent.roomId,
      roomCode: validEvent.roomCode,
      eventId: "not-uuid",
    }).success,
    false,
  );
});
