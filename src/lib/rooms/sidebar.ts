import { cache } from "react";
import { redirect } from "next/navigation";

import type { RoomSidebarItem } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";

/** โหลดรายการห้องสำหรับ sidebar — cache ต่อ request */
export const getSidebarRooms = cache(async (): Promise<RoomSidebarItem[]> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) return [];

  const { data: memberships } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", userId);

  const roomIds = memberships?.map((m) => m.room_id) ?? [];
  if (!roomIds.length) return [];

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, avatar_url, room_code")
    .in("id", roomIds);

  return rooms ?? [];
});

/** ตรวจ session สำหรับ layout แอป — redirect ถ้ายังไม่ล็อกอิน */
export const requireAppUser = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
});
