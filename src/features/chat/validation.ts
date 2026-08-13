import { z } from "zod";

/** ตรวจข้อมูลข้อความห้องก่อนส่งเข้า Server Action */
export const sendRoomMessageSchema = z.object({
  roomCode: z.string().regex(/^\d{6}$/, "รหัสห้องไม่ถูกต้อง"),
  roomId: z.string().uuid("ไม่พบห้องที่ต้องการส่งข้อความ"),
  body: z
    .string()
    .trim()
    .min(1, "กรุณาพิมพ์ข้อความก่อนส่ง")
    .max(1000, "ข้อความยาวเกิน 1,000 ตัวอักษร"),
});

export type SendRoomMessageInput = z.infer<typeof sendRoomMessageSchema>;
