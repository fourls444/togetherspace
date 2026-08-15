"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getRoomPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";

export type UpdateRoomProfileState = {
  error?: string;
  fieldErrors?: {
    avatarUrl?: string[];
    displayName?: string[];
    bio?: string[];
    facebookUrl?: string[];
    lineId?: string[];
    instagramUrl?: string[];
    phone?: string[];
  };
  success?: boolean;
};

const optionalUrl = z
  .union([z.literal(""), z.string().url("กรุณาใส่ลิงก์ให้ถูกต้อง")])
  .transform((value) => value || null);

const roomProfileSchema = z.object({
  avatarUrl: z
    .union([z.literal(""), z.string().url("กรุณาอัปโหลดรูปใหม่อีกครั้ง")])
    .transform((value) => value || null),
  displayName: z
    .string()
    .trim()
    .max(40, "ชื่อในห้องต้องไม่เกิน 40 ตัวอักษร")
    .transform((value) => value || null),
  roomCode: z.string().trim().min(1),
  roomId: z.string().uuid(),
  bio: z.string().trim().max(500, "คำแนะนำตัวไม่เกิน 500 ตัวอักษร").transform((value) => value || null),
  facebookUrl: optionalUrl,
  lineId: z.string().trim().max(80, "Line ID ไม่เกิน 80 ตัวอักษร").transform((value) => value || null),
  instagramUrl: optionalUrl,
  phone: z.string().trim().max(30, "เบอร์โทรไม่เกิน 30 ตัวอักษร").transform((value) => value || null),
});

/** บันทึกชื่อและรูปที่ใช้เฉพาะในห้องปัจจุบัน โดยไม่กระทบโปรไฟล์หลัก */
export async function updateRoomProfile(
  _previousState: UpdateRoomProfileState,
  formData: FormData,
): Promise<UpdateRoomProfileState> {
  void _previousState;

  const result = roomProfileSchema.safeParse({
    avatarUrl: formData.get("avatarUrl"),
    displayName: formData.get("displayName"),
    roomCode: formData.get("roomCode"),
    roomId: formData.get("roomId"),
    bio: formData.get("bio"),
    facebookUrl: formData.get("facebookUrl"),
    lineId: formData.get("lineId"),
    instagramUrl: formData.get("instagramUrl"),
    phone: formData.get("phone"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const { error } = await supabase.rpc("update_room_profile", {
    p_avatar_url: result.data.avatarUrl,
    p_display_name: result.data.displayName,
    p_room_id: result.data.roomId,
  });

  if (error) {
    return { error: "บันทึกโปรไฟล์ในห้องไม่สำเร็จ: " + error.message };
  }

  const { error: friendError } = await supabase.from("friend_profiles").upsert({
    room_id: result.data.roomId,
    user_id: claimsData.claims.sub,
    bio: result.data.bio,
    facebook_url: result.data.facebookUrl,
    line_id: result.data.lineId,
    instagram_url: result.data.instagramUrl,
    phone: result.data.phone,
    updated_at: new Date().toISOString(),
  });

  if (friendError) {
    return { error: "บันทึกข้อมูลติดต่อไม่สำเร็จ: " + friendError.message };
  }

  revalidatePath(getRoomPath(result.data.roomCode));
  revalidatePath(`${getRoomPath(result.data.roomCode)}/members`);
  revalidatePath(`${getRoomPath(result.data.roomCode)}/settings`);
  revalidatePath(`${getRoomPath(result.data.roomCode)}/friend-profiles`);
  return { success: true };
}
