"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validation/auth";

export type UpdateProfileState = {
  error?: string;
  fieldErrors?: {
    displayName?: string[];
    username?: string[];
    avatarUrl?: string[];
  };
  success?: boolean;
};

/** อัปเดตโปรไฟล์ผู้ใช้ปัจจุบัน (display_name, username, avatar_url) */
export async function updateProfile(
  _previousState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  void _previousState;

  const result = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const { error } = await supabase.rpc("update_profile", {
    p_display_name: result.data.displayName,
    p_username: result.data.username,
    p_avatar_url: result.data.avatarUrl,
  });

  if (error) {
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return { fieldErrors: { username: ["ชื่อผู้ใช้นี้ถูกใช้งานแล้ว"] } };
    }
    if (error.message?.includes("username must be between")) {
      return { fieldErrors: { username: ["ชื่อผู้ใช้ต้องมี 3-30 ตัวอักษร (a-z, 0-9, _)"] } };
    }
    return { error: "บันทึกโปรไฟล์ไม่สำเร็จ: " + error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
