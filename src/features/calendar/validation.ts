import { z } from "zod";

export const CALENDAR_EVENT_COLORS = [
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#A855F7",
  "#3B82F6",
  "#06B6D4",
  "#14B8A6",
  "#FACC15",
  "#111827",
  "#F8FAFC",
] as const;

export const createCalendarEventSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  title: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อกิจกรรม")
    .max(120, "ชื่อกิจกรรมต้องไม่เกิน 120 ตัวอักษร"),
  description: z
    .string()
    .trim()
    .max(1000, "รายละเอียดต้องไม่เกิน 1000 ตัวอักษร")
    .transform((value) => value || null),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่ให้ถูกต้อง"),
  color: z.enum(CALENDAR_EVENT_COLORS, {
    message: "กรุณาเลือกสีจากที่กำหนด",
  }),
});

export const updateCalendarEventSchema = createCalendarEventSchema.extend({
  eventId: z.string().uuid(),
});

export const deleteCalendarEventSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  eventId: z.string().uuid(),
});

export type CreateCalendarEventInput = z.infer<
  typeof createCalendarEventSchema
>;
export type UpdateCalendarEventInput = z.infer<
  typeof updateCalendarEventSchema
>;
export type DeleteCalendarEventInput = z.infer<
  typeof deleteCalendarEventSchema
>;
