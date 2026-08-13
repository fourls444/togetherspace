"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendRoomMessageSchema } from "@/features/chat/validation";
import type { RoomChatMessage } from "@/components/rooms/room-chat-widget";
import { getRoomPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

export type SendRoomMessageState = {
  error?: string;
  message?: RoomChatMessage;
  success?: boolean;
};

/** คืน user id จาก session ปัจจุบัน หรือส่งกลับหน้า login ถ้ายังไม่ได้เข้าสู่ระบบ */
async function requireUserId() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/login");

  return { supabase, userId };
}

/** ดึงชื่อและรูปที่ใช้แสดงใน chat โดยให้โปรไฟล์เฉพาะห้องมาก่อนโปรไฟล์หลัก */
async function getSenderView(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  userId: string,
) {
  const [profileResult, roomProfileResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("room_profiles")
      .select("display_name, avatar_url")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    senderAvatarUrl:
      roomProfileResult.data?.avatar_url ??
      profileResult.data?.avatar_url ??
      getDefaultImageUrl("profile"),
    senderName:
      roomProfileResult.data?.display_name ??
      profileResult.data?.display_name ??
      "สมาชิก",
    senderUsername: profileResult.data?.username ?? "member",
  };
}

/** ส่งข้อความเข้า chat กลางของห้อง โดยให้ RLS ตรวจสิทธิ์สมาชิกซ้ำอีกชั้น */
export async function sendRoomMessage(
  formData: FormData,
): Promise<SendRoomMessageState> {
  const result = sendRoomMessageSchema.safeParse({
    body: formData.get("body"),
    roomCode: formData.get("roomCode"),
    roomId: formData.get("roomId"),
  });

  if (!result.success) {
    return {
      error:
        result.error.flatten().fieldErrors.body?.[0] ??
        "ข้อมูลข้อความไม่ถูกต้อง",
    };
  }

  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("room_messages")
    .insert({
      body: result.data.body,
      room_id: result.data.roomId,
      user_id: userId,
    })
    .select("id, room_id, user_id, body, created_at")
    .single();

  if (error || !data) {
    return { error: "ส่งข้อความไม่สำเร็จ: " + (error?.message ?? "") };
  }

  const sender = await getSenderView(supabase, result.data.roomId, userId);
  revalidatePath(getRoomPath(result.data.roomCode), "layout");

  return {
    message: {
      body: data.body,
      createdAt: data.created_at,
      id: data.id,
      senderAvatarUrl: sender.senderAvatarUrl,
      senderName: sender.senderName,
      senderUsername: sender.senderUsername,
      userId: data.user_id,
    },
    success: true,
  };
}
