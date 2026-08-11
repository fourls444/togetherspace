import { z } from "zod";

export const roomTypes = ["friend", "couple", "family"] as const;

export const roomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อห้อง")
    .max(80, "ชื่อห้องต้องไม่เกิน 80 ตัวอักษร"),
  type: z.enum(roomTypes),
  avatarUrl: z
    .union([z.literal(""), z.string().url("กรุณากรอก URL รูปให้ถูกต้อง")])
    .transform((value) => value || null),
});

export const updateRoomDetailsSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  roomCode: z.string().regex(/^\d{6}$/, "รหัสห้องไม่ถูกต้อง"),
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อห้อง")
    .max(80, "ชื่อห้องต้องไม่เกิน 80 ตัวอักษร"),
  avatarUrl: z
    .union([z.literal(""), z.string().url("กรุณาอัปโหลดรูปใหม่อีกครั้ง")])
    .transform((value) => value || null),
});

export type RoomInput = z.infer<typeof roomSchema>;
export type UpdateRoomDetailsInput = z.infer<typeof updateRoomDetailsSchema>;
