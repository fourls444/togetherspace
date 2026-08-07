"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { roomSchema } from "@/lib/validation/rooms";

export type CreateRoomState = {
  error?: string;
  fieldErrors?: { name?: string[]; type?: string[]; avatarUrl?: string[] };
};

/** ตรวจข้อมูลห้องและเรียก RPC ที่สร้างห้องพร้อม Owner membership ใน transaction เดียว */
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

  redirect(`/rooms/${roomId}`);
}
