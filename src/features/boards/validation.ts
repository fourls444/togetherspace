import { z } from "zod";

const boardBaseSchema = {
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardId: z.string().uuid("ID บอร์ดไม่ถูกต้อง"),
  title: z
    .string()
    .trim()
    .min(1, "กรุณากรอกหัวข้อ")
    .max(120, "หัวข้อต้องไม่เกิน 120 ตัวอักษร"),
  body: z
    .string()
    .trim()
    .max(1000, "รายละเอียดต้องไม่เกิน 1000 ตัวอักษร")
    .transform((value) => value || null),
};

export const createNoteSchema = z.object(boardBaseSchema);

export const createChecklistSchema = z.object({
  ...boardBaseSchema,
  checklistItems: z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((items) => items.length > 0, {
      message: "กรุณาเพิ่มรายการ checklist อย่างน้อย 1 รายการ",
    })
    .refine((items) => items.length <= 30, {
      message: "Checklist ใส่ได้ไม่เกิน 30 รายการต่อ card",
    }),
});

export const createPollSchema = z.object({
  ...boardBaseSchema,
  pollVoteMode: z.enum(["single", "multiple"], {
    message: "กรุณาเลือกโหมดการโหวต",
  }),
  pollOptions: z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((items) => items.length >= 2, {
      message: "Poll ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก",
    })
    .refine((items) => items.length <= 10, {
      message: "Poll ใส่ได้ไม่เกิน 10 ตัวเลือก",
    }),
});

export const toggleChecklistSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  checklistItemId: z.string().uuid("ID checklist ไม่ถูกต้อง"),
  isDone: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const votePollSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardItemId: z.string().uuid("ID poll ไม่ถูกต้อง"),
  optionId: z.string().uuid("ID ตัวเลือกไม่ถูกต้อง"),
});

export const archiveBoardItemSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardItemId: z.string().uuid("ID card ไม่ถูกต้อง"),
});

export const updateBoardItemSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardItemId: z.string().uuid("ID card ไม่ถูกต้อง"),
  title: z
    .string()
    .trim()
    .min(1, "กรุณากรอกหัวข้อ")
    .max(120, "หัวข้อต้องไม่เกิน 120 ตัวอักษร"),
  body: z
    .string()
    .trim()
    .max(1000, "รายละเอียดต้องไม่เกิน 1000 ตัวอักษร")
    .transform((value) => value || null),
});

export const updateChecklistItemSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  checklistItemId: z.string().uuid("ID checklist ไม่ถูกต้อง"),
  text: z
    .string()
    .trim()
    .min(1, "กรุณากรอกข้อความ checklist")
    .max(200, "ข้อความ checklist ต้องไม่เกิน 200 ตัวอักษร"),
});

export const createChecklistItemSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardItemId: z.string().uuid("ID checklist ไม่ถูกต้อง"),
  text: z
    .string()
    .trim()
    .min(1, "กรุณากรอกข้อความ checklist")
    .max(200, "ข้อความ checklist ต้องไม่เกิน 200 ตัวอักษร"),
});

export const deleteChecklistItemSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  checklistItemId: z.string().uuid("ID checklist ไม่ถูกต้อง"),
});

export const updatePollOptionSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  optionId: z.string().uuid("ID ตัวเลือกไม่ถูกต้อง"),
  label: z
    .string()
    .trim()
    .min(1, "กรุณากรอกตัวเลือก")
    .max(120, "ตัวเลือกต้องไม่เกิน 120 ตัวอักษร"),
});

export const createPollOptionSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardItemId: z.string().uuid("ID poll ไม่ถูกต้อง"),
  label: z
    .string()
    .trim()
    .min(1, "กรุณากรอกตัวเลือก")
    .max(120, "ตัวเลือกต้องไม่เกิน 120 ตัวอักษร"),
});

export const deletePollOptionSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardItemId: z.string().uuid("ID poll ไม่ถูกต้อง"),
  optionId: z.string().uuid("ID ตัวเลือกไม่ถูกต้อง"),
});

export const updatePollSettingsSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  boardItemId: z.string().uuid("ID poll ไม่ถูกต้อง"),
  pollVoteMode: z.enum(["single", "multiple"]),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type CreatePollInput = z.infer<typeof createPollSchema>;
