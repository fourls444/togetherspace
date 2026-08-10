import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getRoomPath, isRoomCode } from "@/lib/rooms/room-path";

const roomUuidSchema = z.string().uuid();

/** โหลดห้องจาก URL โดยรับได้ทั้ง room code และ UUID เก่า แต่บังคับ URL ให้แสดงเป็น room code */
export async function getRoomContext(roomSlug: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const currentUserId = claimsData?.claims.sub;

  if (!currentUserId) redirect("/login");

  if (!isRoomCode(roomSlug) && !roomUuidSchema.safeParse(roomSlug).success) {
    notFound();
  }

  const userMembershipsResult = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", currentUserId);

  const userRoomIds = userMembershipsResult.data?.map((m) => m.room_id) ?? [];
  const sidebarRoomsResult = userRoomIds.length
    ? await supabase
        .from("rooms")
        .select("id, name, avatar_url, room_code")
        .in("id", userRoomIds)
    : { data: [] };

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
      sidebarRooms: sidebarRoomsResult.data ?? [],
      supabase,
    };
  }

  if (roomSlug !== roomResult.data.room_code) {
    redirect(getRoomPath(roomResult.data.room_code));
  }

  return {
    currentUserId,
    isMember: true as const,
    room: roomResult.data,
    roomCode: roomResult.data.room_code,
    roomId: roomResult.data.id,
    roomPath: getRoomPath(roomResult.data.room_code),
    sidebarRooms: sidebarRoomsResult.data ?? [],
    supabase,
  };
}
