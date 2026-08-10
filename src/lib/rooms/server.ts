import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { getRoomPath, isRoomCode } from "@/lib/rooms/room-path";
import { requireAppUser } from "@/lib/rooms/sidebar";

const roomUuidSchema = z.string().uuid();

/** โหลดห้องจาก URL โดยรับได้ทั้ง room code และ UUID เก่า แต่บังคับ URL ให้แสดงเป็น room code */
export const getRoomContext = cache(async (roomSlug: string) => {
  const { userId: currentUserId, supabase } = await requireAppUser();

  if (!isRoomCode(roomSlug) && !roomUuidSchema.safeParse(roomSlug).success) {
    notFound();
  }

  const roomQuery = supabase
    .from("rooms")
    .select("id, name, type, avatar_url, created_at, room_code");

  const roomResult = isRoomCode(roomSlug)
    ? await roomQuery.eq("room_code", roomSlug).maybeSingle()
    : await roomQuery.eq("id", roomSlug).maybeSingle();

  if (!roomResult.data) {
    return {
      currentUserId,
      isMember: false as const,
      supabase,
    };
  }

  if (roomSlug !== roomResult.data.room_code) {
    redirect(getRoomPath(roomResult.data.room_code));
  }

  // RLS ทำให้เห็นห้องได้เฉพาะสมาชิก — มีข้อมูลห้อง = เป็นสมาชิก
  return {
    currentUserId,
    isMember: true as const,
    room: roomResult.data,
    roomCode: roomResult.data.room_code,
    roomId: roomResult.data.id,
    roomPath: getRoomPath(roomResult.data.room_code),
    supabase,
  };
});
