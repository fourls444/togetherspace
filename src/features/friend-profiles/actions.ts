"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRoomSubPath } from "@/lib/rooms/room-path";

export type FriendProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

const optionalUrl = z
  .union([z.literal(""), z.string().url("กรุณาใส่ลิงก์ให้ถูกต้อง")])
  .transform((value) => value || null);

const schema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  bio: z.string().trim().max(500, "คำแนะนำตัวไม่เกิน 500 ตัวอักษร").transform((value) => value || null),
  facebookUrl: optionalUrl,
  lineId: z.string().trim().max(80, "Line ID ไม่เกิน 80 ตัวอักษร").transform((value) => value || null),
  instagramUrl: optionalUrl,
  phone: z.string().trim().max(30, "เบอร์โทรไม่เกิน 30 ตัวอักษร").transform((value) => value || null),
});

/** บันทึกข้อมูลติดต่อของโปรไฟล์เพื่อน โดยแก้ไขได้เฉพาะตัวเอง */
export async function updateFriendProfile(
  _previousState: FriendProfileActionState,
  formData: FormData,
): Promise<FriendProfileActionState> {
  void _previousState;
  const parsed = schema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    bio: formData.get("bio"),
    facebookUrl: formData.get("facebookUrl"),
    lineId: formData.get("lineId"),
    instagramUrl: formData.get("instagramUrl"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) redirect("/login");

  const { error } = await supabase.from("friend_profiles").upsert({
    room_id: parsed.data.roomId,
    user_id: userId,
    bio: parsed.data.bio,
    facebook_url: parsed.data.facebookUrl,
    line_id: parsed.data.lineId,
    instagram_url: parsed.data.instagramUrl,
    phone: parsed.data.phone,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "บันทึกโปรไฟล์เพื่อนไม่สำเร็จ: " + error.message };

  revalidatePath(getRoomSubPath(parsed.data.roomCode, "friend-profiles"));
  revalidatePath(getRoomSubPath(parsed.data.roomCode, `friend-profiles/${userId}`));
  return { success: true };
}
