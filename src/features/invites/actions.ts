"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createInviteSchema,
  joinByCodeSchema,
} from "@/features/invites/validation";
import { getRoomPath, getRoomSubPath, isRoomCode } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";

export type CreateInviteState = {
  error?: string;
  fieldErrors?: { maxUses?: string[]; expiresAt?: string[] };
  success?: boolean;
};

export type JoinByCodeState = {
  error?: string;
  fieldErrors?: { inviteCode?: string[] };
};

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function createInvite(
  _previousState: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const roomId = formData.get("roomId");
  const roomCode = formData.get("roomCode");
  const maxUses = formData.get("maxUses");
  const expiresAt = formData.get("expiresAt");

  const result = createInviteSchema.safeParse({ roomId, maxUses, expiresAt });
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const args: {
    p_room_id: string;
    p_max_uses?: number;
    p_expires_at?: string;
  } = {
    p_room_id: result.data.roomId,
  };

  if (result.data.maxUses !== null) {
    args.p_max_uses = result.data.maxUses;
  }
  if (result.data.expiresAt !== null) {
    args.p_expires_at = result.data.expiresAt;
  }

  const { error } = await supabase.rpc("create_room_invite", args);

  if (error) {
    return { error: "สร้างลิงก์คำเชิญไม่สำเร็จ: " + error.message };
  }

  revalidatePath(getSettingsPath(roomCode, result.data.roomId));
  return { success: true };
}

export async function revokeInvite(
  inviteId: string,
  roomId: string,
  roomCode?: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const { error } = await supabase.rpc("revoke_invite", {
    p_invite_id: inviteId,
  });

  if (error) {
    return { error: "ยกเลิกรหัสคำเชิญไม่สำเร็จ" };
  }

  revalidatePath(getSettingsPath(roomCode, roomId));
  return { success: true };
}

/** คืน path หน้าตั้งค่าจาก room code ถ้ามี ไม่เช่นนั้น fallback เป็น UUID path */
function getSettingsPath(roomCode: FormDataEntryValue | string | null | undefined, roomId: string) {
  return typeof roomCode === "string" && isRoomCode(roomCode)
    ? getRoomSubPath(roomCode, "settings")
    : `/rooms/${roomId}/settings`;
}

/** หา room code จาก room id เพื่อใช้ redirect โดยไม่โชว์ UUID บน URL */
async function getRoomCodeById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
) {
  const { data: room } = await supabase
    .from("rooms")
    .select("room_code")
    .eq("id", roomId)
    .single();

  return room?.room_code ?? roomId;
}

export async function joinRoomByCode(
  _previousState: JoinByCodeState,
  formData: FormData,
): Promise<JoinByCodeState> {
  const inviteCode = formData.get("inviteCode");

  const result = joinByCodeSchema.safeParse({ inviteCode });
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) {
    redirect(`/login?next=/dashboard/join-room`);
  }

  const { data: roomId, error } = await supabase.rpc("join_room_by_code", {
    p_invite_code: result.data.inviteCode,
  });

  if (error || !roomId) {
    if (error?.message?.includes("expired")) {
      return { error: "รหัสคำเชิญนี้หมดอายุแล้ว" };
    }
    if (error?.message?.includes("revoked")) {
      return { error: "รหัสคำเชิญนี้ถูกยกเลิกแล้ว" };
    }
    if (error?.message?.includes("limit reached")) {
      return { error: "รหัสคำเชิญนี้ถูกใช้งานครบจำนวนแล้ว" };
    }
    if (error?.message?.includes("not found")) {
      return { error: "ไม่พบรหัสคำเชิญนี้ กรุณาตรวจสอบอีกครั้ง" };
    }
    return { error: "เข้าร่วมห้องไม่สำเร็จ กรุณาตรวจสอบรหัสคำเชิญ" };
  }

  const roomCode = await getRoomCodeById(supabase, roomId);
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect(getRoomPath(roomCode));
}

export async function joinRoomByToken(
  tokenOrCode: string,
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) {
    redirect(`/login?next=/invite/${tokenOrCode}`);
  }

  const { data: roomId, error } = await supabase.rpc("join_room_by_invite", {
    p_invite_token: tokenOrCode,
  });

  if (error || !roomId) {
    if (error?.message?.includes("expired")) {
      return { error: "คำเชิญนี้หมดอายุแล้ว" };
    }
    if (error?.message?.includes("revoked")) {
      return { error: "คำเชิญนี้ถูกยกเลิกแล้ว" };
    }
    if (error?.message?.includes("limit reached")) {
      return { error: "คำเชิญนี้ถูกใช้งานครบจำนวนแล้ว" };
    }
    return { error: "เข้าร่วมห้องไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }

  const roomCode = await getRoomCodeById(supabase, roomId);
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect(getRoomPath(roomCode));
}
