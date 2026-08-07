import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const signupSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "กรุณากรอกชื่อที่แสดง")
      .max(80, "ชื่อที่แสดงต้องไม่เกิน 80 ตัวอักษร"),
    email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  // ตรวจความสัมพันธ์ระหว่างสองช่องซึ่ง validation รายช่องตรวจเองไม่ได้
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "รหัสผ่านไม่ตรงกัน",
        path: ["confirmPassword"],
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
