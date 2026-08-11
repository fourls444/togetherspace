import { z } from "zod";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่ให้ถูกต้อง");

const albumPhotoMetadataSchema = z.object({
  imageUrl: z.string().url("รูปภาพไม่ถูกต้อง"),
  storagePath: z.string().trim().min(1, "ไม่พบตำแหน่งไฟล์ใน Storage"),
});

/** จัดข้อความกำกับรูปให้สั้น อ่านง่าย และคืน null เมื่อผู้ใช้ไม่กรอก */
export function normalizeAlbumCaption(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  const caption = value.trim();
  return caption.length ? caption : null;
}

/** คืนวันที่ของรูป ถ้าไม่ได้เลือกวันที่จะใช้วันที่อัปโหลดเป็นค่าเริ่มต้น */
export function getAlbumTakenDate(
  value: FormDataEntryValue | null,
  fallbackDate: string,
) {
  if (typeof value !== "string" || !value.trim()) return fallbackDate;
  return value.trim();
}

/** แปลง JSON metadata จาก client หลังอัปโหลดไฟล์ขึ้น Storage แล้ว */
function parsePhotosJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [];
  }
}

/** แปลง JSON รายการ id รูปจาก client หลังผู้ใช้ลากวางจัดลำดับใหม่ */
function parsePhotoIdsJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [];
  }
}

export const saveAlbumPhotosSchema = z
  .object({
    roomId: z.string().uuid(),
    roomCode: z.string().regex(/^\d{6}$/),
    caption: z
      .custom<FormDataEntryValue | null>()
      .transform((value) => normalizeAlbumCaption(value))
      .pipe(
        z
          .string()
          .max(280, "คำบรรยายต้องไม่เกิน 280 ตัวอักษร")
          .nullable(),
      ),
    takenAt: z
      .custom<FormDataEntryValue | null>()
      .transform((value) => getAlbumTakenDate(value, "1970-01-01"))
      .pipe(dateKeySchema),
    photosJson: z
      .custom<FormDataEntryValue | null>()
      .transform(parsePhotosJson)
      .pipe(
        z
          .array(albumPhotoMetadataSchema)
          .min(1, "กรุณาเลือกรูปอย่างน้อย 1 รูป")
          .max(20, "อัปโหลดได้สูงสุดครั้งละ 20 รูป"),
      ),
  })
  .transform(({ photosJson, ...data }) => ({
    ...data,
    photos: photosJson,
  }));

export const deleteAlbumPhotoSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  photoId: z.string().uuid(),
  storagePath: z.string().trim().min(1),
});

export const reorderAlbumPhotoSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  photoId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const saveAlbumPhotoOrderSchema = z
  .object({
    roomId: z.string().uuid(),
    roomCode: z.string().regex(/^\d{6}$/),
    dateKey: dateKeySchema,
    photoIdsJson: z
      .custom<FormDataEntryValue | null>()
      .transform(parsePhotoIdsJson)
      .pipe(z.array(z.string().uuid()).min(1)),
  })
  .transform(({ photoIdsJson, ...data }) => ({
    ...data,
    photoIds: photoIdsJson,
  }));

export type SaveAlbumPhotosInput = z.infer<typeof saveAlbumPhotosSchema>;
export type DeleteAlbumPhotoInput = z.infer<typeof deleteAlbumPhotoSchema>;
export type ReorderAlbumPhotoInput = z.infer<typeof reorderAlbumPhotoSchema>;
export type SaveAlbumPhotoOrderInput = z.infer<
  typeof saveAlbumPhotoOrderSchema
>;
