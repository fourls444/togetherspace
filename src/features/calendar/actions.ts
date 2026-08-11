"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createCalendarEventSchema,
  deleteCalendarEventSchema,
  updateCalendarEventSchema,
} from "@/features/calendar/validation";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";

export type CalendarActionState = {
  error?: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
    eventDate?: string[];
  };
  success?: boolean;
};

function getCalendarPath(roomCode: string) {
  return getRoomSubPath(roomCode, "calendar");
}

function revalidateCalendarPaths(roomCode: string) {
  revalidatePath(getCalendarPath(roomCode));
  revalidatePath(`${getCalendarPath(roomCode)}/list`);
}

/** คืน session ปัจจุบัน ถ้ายังไม่ได้ login จะพาไปหน้า login */
async function requireCalendarUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/login");

  return { supabase, userId };
}

/** เพิ่มกิจกรรมลงปฏิทินของห้อง พร้อมสีที่ใช้แสดงบนช่องวัน */
export async function createCalendarEvent(
  _previousState: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  void _previousState;

  const result = createCalendarEventSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    title: formData.get("title"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { supabase, userId } = await requireCalendarUser();

  const { error } = await supabase.from("calendar_events").insert({
    room_id: result.data.roomId,
    title: result.data.title,
    description: result.data.description,
    event_date: result.data.eventDate,
    created_by: userId,
  });

  if (error) {
    return { error: "เพิ่มกิจกรรมไม่สำเร็จ: " + error.message };
  }

  revalidateCalendarPaths(result.data.roomCode);
  return { success: true };
}

/** แก้ไขกิจกรรมเดิมของห้อง โดยให้ RLS ในฐานข้อมูลคุมสิทธิ์จริง */
export async function updateCalendarEvent(
  formData: FormData,
): Promise<CalendarActionState> {
  const result = updateCalendarEventSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "ข้อมูลกิจกรรมไม่ถูกต้อง" };
  }

  const { supabase } = await requireCalendarUser();
  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: result.data.title,
      description: result.data.description,
      event_date: result.data.eventDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.eventId)
    .eq("room_id", result.data.roomId);

  if (error) return { error: "แก้ไขกิจกรรมไม่สำเร็จ: " + error.message };

  revalidateCalendarPaths(result.data.roomCode);
  return { success: true };
}

/** ลบกิจกรรมออกจากปฏิทินห้อง */
export async function deleteCalendarEvent(
  formData: FormData,
): Promise<CalendarActionState> {
  const result = deleteCalendarEventSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    eventId: formData.get("eventId"),
  });

  if (!result.success) return { error: "ข้อมูลกิจกรรมไม่ถูกต้อง" };

  const { supabase } = await requireCalendarUser();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", result.data.eventId)
    .eq("room_id", result.data.roomId);

  if (error) return { error: "ลบกิจกรรมไม่สำเร็จ: " + error.message };

  revalidateCalendarPaths(result.data.roomCode);
  return { success: true };
}
