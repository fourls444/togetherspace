import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "ชื่อบัญชีต้องมีอย่างน้อย 3 ตัวอักษร")
      .max(30, "ชื่อบัญชีต้องไม่เกิน 30 ตัวอักษร")
      .regex(
        /^[a-z0-9_]+$/i,
        "ชื่อบัญชีใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และ _",
      )
      .transform((v) => v.toLowerCase()),
    email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "รหัสผ่านยังไม่ตรงกัน ลองพิมพ์ใหม่อีกครั้งนะ",
        path: ["confirmPassword"],
      });
    }
  });

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อที่แสดง")
    .max(80, "ชื่อที่แสดงต้องไม่เกิน 80 ตัวอักษร"),
  username: z
    .string()
    .trim()
    .min(3, "ชื่อบัญชีต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(30, "ชื่อบัญชีต้องไม่เกิน 30 ตัวอักษร")
    .regex(
      /^[a-z0-9_]+$/i,
      "ชื่อบัญชีใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และ _",
    )
    .transform((v) => v.toLowerCase()),
  avatarUrl: z
    .union([z.literal(""), z.string().url("กรุณากรอก URL รูปให้ถูกต้อง")])
    .transform((v) => v || null),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
