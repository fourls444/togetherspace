"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { RoomRole } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

export type MemberActionState = {
  error?: string;
  success?: boolean;
};

export async function kickMember(
  roomId: string,
  targetUserId: string,
): Promise<MemberActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const { error } = await supabase.rpc("kick_member", {
    p_room_id: roomId,
    p_user_id: targetUserId,
  });

  if (error) {
    return { error: "ไม่สามารถลบสมาชิกออกจากห้องได้: " + error.message };
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/members`);
  revalidatePath(`/rooms/${roomId}/settings`);
  return { success: true };
}

export async function changeMemberRole(
  roomId: string,
  targetUserId: string,
  newRole: RoomRole,
): Promise<MemberActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const { error } = await supabase.rpc("change_member_role", {
    p_room_id: roomId,
    p_user_id: targetUserId,
    p_new_role: newRole,
  });

  if (error) {
    if (error.message?.includes("at least one owner")) {
      return { error: "ห้องต้องมี Owner อย่างน้อย 1 คนเสมอ" };
    }
    return { error: "เปลี่ยนบทบาทไม่สำเร็จ: " + error.message };
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/members`);
  revalidatePath(`/rooms/${roomId}/settings`);
  return { success: true };
}

export async function leaveRoom(roomId: string): Promise<MemberActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const { error } = await supabase.rpc("leave_room", {
    p_room_id: roomId,
  });

  if (error) {
    if (error.message?.includes("last owner")) {
      return { error: "คุณเป็น Owner คนเดียวในห้อง ต้องโอนสิทธิ์ Owner ให้สมาชิกอื่นก่อนออกจากห้อง" };
    }
    return { error: "ออกจากห้องไม่สำเร็จ: " + error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
