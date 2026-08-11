"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  roomSchema,
  updateRoomDetailsSchema,
} from "@/features/rooms/validation";
import { getRoomPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";
import { getStorageObjectFromPublicUrl } from "@/lib/uploads/image-upload";

export type CreateRoomState = {
  error?: string;
  fieldErrors?: { name?: string[]; type?: string[]; avatarUrl?: string[] };
};

export type UpdateRoomDetailsState = {
  error?: string;
  fieldErrors?: { avatarUrl?: string[]; name?: string[] };
  success?: boolean;
};

export async function createRoom(
  _previousState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const result = roomSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const { data: roomId, error } = await supabase.rpc("create_room", {
    p_name: result.data.name,
    p_type: result.data.type,
    p_avatar_url: result.data.avatarUrl,
  });

  if (error || !roomId) {
    return { error: "สร้างห้องไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("room_code")
    .eq("id", roomId)
    .single();

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect(getRoomPath(room?.room_code ?? roomId));
}

/** แก้ชื่อและรูปห้องสำหรับ owner โดยไม่เปิดให้เปลี่ยนประเภทห้อง */
export async function updateRoomDetails(
  _previousState: UpdateRoomDetailsState,
  formData: FormData,
): Promise<UpdateRoomDetailsState> {
  void _previousState;

  const result = updateRoomDetailsSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    name: formData.get("name"),
    avatarUrl: formData.get("avatarUrl"),
  });
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) redirect("/login");

  const [{ data: membership }, { data: currentRoom, error: roomError }] =
    await Promise.all([
      supabase
        .from("room_members")
        .select("role")
        .eq("room_id", result.data.roomId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("rooms")
        .select("avatar_url")
        .eq("id", result.data.roomId)
        .maybeSingle(),
    ]);

  if (membership?.role !== "owner") {
    return { error: "เฉพาะเจ้าของห้องเท่านั้นที่แก้ข้อมูลห้องได้" };
  }
  if (roomError || !currentRoom) return { error: "ไม่พบข้อมูลห้อง" };

  const { error } = await supabase
    .from("rooms")
    .update({
      avatar_url: result.data.avatarUrl,
      name: result.data.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.roomId);
  if (error) {
    if (
      result.data.avatarUrl &&
      result.data.avatarUrl !== currentRoom.avatar_url
    ) {
      const unusedObject = getStorageObjectFromPublicUrl(
        result.data.avatarUrl,
      );
      if (unusedObject) {
        await supabase.storage
          .from(unusedObject.bucket)
          .remove([unusedObject.path]);
      }
    }
    return { error: "บันทึกข้อมูลห้องไม่สำเร็จ: " + error.message };
  }

  if (
    currentRoom.avatar_url &&
    currentRoom.avatar_url !== result.data.avatarUrl
  ) {
    const oldObject = getStorageObjectFromPublicUrl(currentRoom.avatar_url);
    if (oldObject) {
      await supabase.storage.from(oldObject.bucket).remove([oldObject.path]);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(getRoomPath(result.data.roomCode), "layout");
  return { success: true };
}
