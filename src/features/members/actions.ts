"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getRoomPath, getRoomSubPath, isRoomCode } from "@/lib/rooms/room-path";
import type { RoomRole } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

export type MemberActionState = {
  error?: string;
  success?: boolean;
};

export async function kickMember(
  roomId: string,
  targetUserId: string,
  roomCode?: string,
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

  revalidateRoomPaths(roomId, roomCode);
  return { success: true };
}

export async function changeMemberRole(
  roomId: string,
  targetUserId: string,
  newRole: RoomRole,
  roomCode?: string,
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
      return { error: "ห้องต้องมีเจ้าของอย่างน้อย 1 คนเสมอ" };
    }
    return { error: "เปลี่ยนบทบาทไม่สำเร็จ: " + error.message };
  }

  revalidateRoomPaths(roomId, roomCode);
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
      return { error: "คุณเป็นเจ้าของคนเดียวในห้อง ต้องโอนสิทธิ์เจ้าของให้สมาชิกอื่นก่อนออกจากห้อง" };
    }
    return { error: "ออกจากห้องไม่สำเร็จ: " + error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Refresh path ห้องทั้งหน้าหลัก สมาชิก และตั้งค่า โดยเลือกใช้ room code ถ้ามี */
function revalidateRoomPaths(roomId: string, roomCode?: string) {
  if (roomCode && isRoomCode(roomCode)) {
    revalidatePath(getRoomPath(roomCode));
    revalidatePath(getRoomSubPath(roomCode, "members"));
    revalidatePath(getRoomSubPath(roomCode, "settings"));
    return;
  }

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/rooms/${roomId}/members`);
  revalidatePath(`/rooms/${roomId}/settings`);
}
