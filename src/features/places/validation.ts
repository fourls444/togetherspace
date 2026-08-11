import { z } from "zod";

const coordinateString = z
  .string()
  .trim()
  .min(1, "กรุณากรอกพิกัด")
  .transform((value) => Number(value))
  .pipe(z.number().finite("พิกัดต้องเป็นตัวเลข"));

/** แปลงวันที่ว่างให้เป็น null เพราะสถานที่บางจุดไม่จำเป็นต้องผูกกับวัน */
const optionalDate = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่ให้ถูกต้อง")
      .nullable(),
  );

export const createPlaceSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อสถานที่")
    .max(120, "ชื่อสถานที่ต้องไม่เกิน 120 ตัวอักษร"),
  description: z
    .string()
    .trim()
    .max(1000, "รายละเอียดต้องไม่เกิน 1000 ตัวอักษร")
    .transform((value) => value || null),
  latitude: coordinateString
    .refine((value) => value >= -90, "ละติจูดต้องไม่ต่ำกว่า -90")
    .refine((value) => value <= 90, "ละติจูดต้องไม่เกิน 90"),
  longitude: coordinateString
    .refine((value) => value >= -180, "ลองจิจูดต้องไม่ต่ำกว่า -180")
    .refine((value) => value <= 180, "ลองจิจูดต้องไม่เกิน 180"),
  placeDate: optionalDate,
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
