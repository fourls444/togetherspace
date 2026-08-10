import { cache } from "react";

import type { RoomSidebarItem } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** โหลดรายการห้องสำหรับ sidebar — หนึ่ง query + cache ต่อ request */
export const getSidebarRooms = cache(async (): Promise<RoomSidebarItem[]> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) return [];

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, avatar_url, room_code, room_members!inner(user_id)")
    .eq("room_members.user_id", userId);

  return (rooms ?? []).map((room) => ({
    id: room.id,
    name: room.name,
    avatar_url: room.avatar_url,
    room_code: room.room_code,
  }));
});

/** ตรวจ session สำหรับหน้าแอป — redirect ถ้ายังไม่ล็อกอิน */
export const requireAppUser = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
});
