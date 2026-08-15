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
  };
  success?: boolean;
};

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

  revalidatePath(getRoomPath(result.data.roomCode));
  revalidatePath(`${getRoomPath(result.data.roomCode)}/members`);
  revalidatePath(`${getRoomPath(result.data.roomCode)}/settings`);
  return { success: true };
}
