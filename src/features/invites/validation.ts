import { z } from "zod";

export const createInviteSchema = z.object({
  roomId: z.string().uuid("ID ห้องไม่ถูกต้อง"),
  maxUses: z
    .union([
      z.literal(""),
      z.coerce.number().int().min(1, "จำนวนครั้งต้องเป็นตัวเลขมากกว่า 0"),
    ])
    .transform((val) => (val === "" ? null : val)),
  expiresAt: z
    .union([z.literal(""), z.string()])
    .transform((val) => (val ? new Date(val).toISOString() : null)),
});

export const joinByCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสคำเชิญ")
    .max(50, "รหัสคำเชิญไม่ถูกต้อง"),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type JoinByCodeInput = z.infer<typeof joinByCodeSchema>;
