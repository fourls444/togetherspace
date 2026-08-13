"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createPlaceSchema,
  deletePlaceSchema,
  updatePlaceSchema,
} from "@/features/places/validation";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";

export type PlaceActionState = {
  error?: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    latitude?: string[];
    longitude?: string[];
    placeDate?: string[];
  };
  success?: boolean;
};

/** โหลดผู้ใช้ปัจจุบัน ถ้ายังไม่เข้าสู่ระบบให้กลับไปหน้า login */
async function requirePlaceUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/login");

  return { supabase, userId };
}

/** เพิ่มสถานที่ใหม่เข้าแผนที่ของห้อง โดยให้ RLS ตรวจสิทธิ์สมาชิกจริง */
export async function createPlace(
  _previousState: PlaceActionState,
  formData: FormData,
): Promise<PlaceActionState> {
  void _previousState;

  const result = createPlaceSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    name: formData.get("name"),
    description: formData.get("description"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    placeDate: formData.get("placeDate"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { supabase, userId } = await requirePlaceUser();
  const { error } = await supabase.from("room_places").insert({
    room_id: result.data.roomId,
    name: result.data.name,
    description: result.data.description,
    latitude: result.data.latitude,
    longitude: result.data.longitude,
    place_date: result.data.placeDate,
    created_by: userId,
  });

  if (error) {
    return { error: `เพิ่มสถานที่ไม่สำเร็จ: ${error.message}` };
  }

  revalidatePath(getRoomSubPath(result.data.roomCode, "map"));
  return { success: true };
}

/** อัปเดตสถานที่ที่มีอยู่ — RLS อนุญาตให้สมาชิกทุกคนแก้ไขได้ */
export async function updatePlace(
  formData: FormData,
): Promise<PlaceActionState> {
  const result = updatePlaceSchema.safeParse({
    placeId: formData.get("placeId"),
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    name: formData.get("name"),
    description: formData.get("description"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    placeDate: formData.get("placeDate"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { supabase } = await requirePlaceUser();
  const { error } = await supabase
    .from("room_places")
    .update({
      name: result.data.name,
      description: result.data.description,
      latitude: result.data.latitude,
      longitude: result.data.longitude,
      place_date: result.data.placeDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.placeId)
    .eq("room_id", result.data.roomId);

  if (error) {
    return { error: `แก้ไขสถานที่ไม่สำเร็จ: ${error.message}` };
  }

  revalidatePath(getRoomSubPath(result.data.roomCode, "map"));
  return { success: true };
}

/** ลบสถานที่ — RLS อนุญาตให้สมาชิกทุกคนในห้องลบได้ */
export async function deletePlace(
  formData: FormData,
): Promise<{ error?: string }> {
  const result = deletePlaceSchema.safeParse({
    placeId: formData.get("placeId"),
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
  });

  if (!result.success) {
    return { error: "ข้อมูลไม่ครบถ้วน ไม่สามารถลบสถานที่ได้" };
  }

  const { supabase } = await requirePlaceUser();
  const { error } = await supabase
    .from("room_places")
    .delete()
    .eq("id", result.data.placeId)
    .eq("room_id", result.data.roomId);

  if (error) {
    return { error: `ลบสถานที่ไม่สำเร็จ: ${error.message}` };
  }

  revalidatePath(getRoomSubPath(result.data.roomCode, "map"));
  return {};
}
