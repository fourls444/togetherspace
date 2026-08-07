import { z } from "zod";

export const roomTypes = ["friend", "couple", "family"] as const;

// กำหนด business rules ของข้อมูลก่อนส่งให้ RPC สร้างห้อง
export const roomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อห้อง")
    .max(80, "ชื่อห้องต้องไม่เกิน 80 ตัวอักษร"),
  type: z.enum(roomTypes),
  avatarUrl: z
    .union([z.literal(""), z.string().url("กรุณากรอก URL รูปให้ถูกต้อง")])
    // เปลี่ยนช่องว่างเป็น null ให้ตรงกับชนิดข้อมูลในฐานข้อมูล
    .transform((value) => value || null),
});

export type RoomInput = z.infer<typeof roomSchema>;
