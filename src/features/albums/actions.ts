"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deleteAlbumPhotoSchema,
  getAlbumTakenDate,
  reorderAlbumPhotoSchema,
  saveAlbumPhotoOrderSchema,
  saveAlbumPhotosSchema,
} from "@/features/albums/validation";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";
import { getImageUploadBucket } from "@/lib/uploads/image-upload";

export type AlbumActionState = {
  error?: string;
  fieldErrors?: {
    caption?: string[];
    photosJson?: string[];
    takenAt?: string[];
  };
  success?: boolean;
};

/** คืน path หน้าอัลบั้มของห้อง เพื่อใช้ revalidate หลังมีการเปลี่ยนแปลงรูป */
function getAlbumPath(roomCode: string) {
  return getRoomSubPath(roomCode, "album");
}

/** แปลงวันที่ปัจจุบันเป็น yyyy-mm-dd สำหรับ default วันที่รูป */
function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

/** คืน user ปัจจุบัน ถ้ายังไม่ได้ login จะพากลับไปหน้า login */
async function requireAlbumUser() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/login");

  return { supabase, userId };
}

/** ตรวจว่าสมาชิกปัจจุบันอยู่ในห้องนี้จริงก่อนจัดการรูปในอัลบั้ม */
async function getRoomMemberRole(roomId: string) {
  const { supabase, userId } = await requireAlbumUser();
  const { data } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  return { role: data?.role ?? null, supabase, userId };
}

/** บันทึก metadata รูปหลายรูปที่ client อัปโหลดขึ้น Storage แล้ว พร้อมเรียง sort_order ต่อจากรูปเดิม */
export async function saveAlbumPhotos(
  _previousState: AlbumActionState,
  formData: FormData,
): Promise<AlbumActionState> {
  void _previousState;

  const result = saveAlbumPhotosSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    caption: formData.get("caption"),
    takenAt: getAlbumTakenDate(formData.get("takenAt"), getTodayDateKey()),
    photosJson: formData.get("photosJson"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { role, supabase, userId } = await getRoomMemberRole(
    result.data.roomId,
  );

  if (!role) {
    return { error: "คุณไม่ได้อยู่ในห้องนี้ จึงเพิ่มรูปไม่ได้" };
  }

  const { data: latestPhoto } = await supabase
    .from("album_photos")
    .select("sort_order")
    .eq("room_id", result.data.roomId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const baseSortOrder = latestPhoto?.sort_order ?? -1;

  const rows = result.data.photos.map((photo, index) => ({
    room_id: result.data.roomId,
    uploaded_by: userId,
    image_url: photo.imageUrl,
    storage_path: photo.storagePath,
    caption: result.data.caption,
    taken_at: result.data.takenAt,
    sort_order: baseSortOrder + index + 1,
  }));

  const { error } = await supabase.from("album_photos").insert(rows);

  if (error) {
    return { error: "เพิ่มรูปไม่สำเร็จ: " + error.message };
  }

  revalidatePath(getAlbumPath(result.data.roomCode));
  return { success: true };
}

/** ลบรูปออกจากตารางและ Storage โดยให้ RLS ตรวจสิทธิ์จริงอีกชั้น */
export async function deleteAlbumPhoto(formData: FormData) {
  const result = deleteAlbumPhotoSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    photoId: formData.get("photoId"),
    storagePath: formData.get("storagePath"),
  });

  if (!result.success) return;

  const { role, supabase, userId } = await getRoomMemberRole(
    result.data.roomId,
  );

  if (!role) return;

  const { data: photo } = await supabase
    .from("album_photos")
    .select("uploaded_by, storage_path")
    .eq("id", result.data.photoId)
    .eq("room_id", result.data.roomId)
    .maybeSingle();

  if (!photo) return;
  if (photo.uploaded_by !== userId && role !== "owner") return;

  await supabase
    .from("album_photos")
    .delete()
    .eq("id", result.data.photoId)
    .eq("room_id", result.data.roomId);
  await supabase.storage
    .from(getImageUploadBucket("album"))
    .remove([photo.storage_path]);

  revalidatePath(getAlbumPath(result.data.roomCode));
}

/** เลื่อนลำดับรูปภายในวันที่เดียวกัน โดยสลับ sort_order กับรูปข้างเคียง */
export async function reorderAlbumPhoto(formData: FormData) {
  const result = reorderAlbumPhotoSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    photoId: formData.get("photoId"),
    direction: formData.get("direction"),
  });

  if (!result.success) return;

  const { role, supabase, userId } = await getRoomMemberRole(
    result.data.roomId,
  );

  if (!role) return;

  const { data: currentPhoto } = await supabase
    .from("album_photos")
    .select("id, uploaded_by, taken_at")
    .eq("id", result.data.photoId)
    .eq("room_id", result.data.roomId)
    .maybeSingle();

  if (!currentPhoto) return;

  const { data: sameDayPhotos } = await supabase
    .from("album_photos")
    .select("id, uploaded_by, sort_order, created_at")
    .eq("room_id", result.data.roomId)
    .eq("taken_at", currentPhoto.taken_at)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const photos = sameDayPhotos ?? [];
  const currentIndex = photos.findIndex((photo) => photo.id === currentPhoto.id);
  const nextIndex =
    result.data.direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const targetPhoto = photos[nextIndex];

  if (currentIndex < 0 || !targetPhoto) return;
  if (
    role !== "owner" &&
    (currentPhoto.uploaded_by !== userId || targetPhoto.uploaded_by !== userId)
  ) {
    return;
  }

  await supabase
    .from("album_photos")
    .update({
      sort_order: targetPhoto.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentPhoto.id)
    .eq("room_id", result.data.roomId);
  await supabase
    .from("album_photos")
    .update({
      sort_order: photos[currentIndex].sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetPhoto.id)
    .eq("room_id", result.data.roomId);

  revalidatePath(getAlbumPath(result.data.roomCode));
}

/** บันทึกลำดับรูปจาก drag and drop โดยเรียงใหม่เฉพาะรูปในวันที่เดียวกัน */
export async function saveAlbumPhotoOrder(formData: FormData) {
  const result = saveAlbumPhotoOrderSchema.safeParse({
    roomId: formData.get("roomId"),
    roomCode: formData.get("roomCode"),
    dateKey: formData.get("dateKey"),
    photoIdsJson: formData.get("photoIdsJson"),
  });

  if (!result.success) return;

  const { role, supabase, userId } = await getRoomMemberRole(
    result.data.roomId,
  );

  if (!role) return;

  const { data: photos } = await supabase
    .from("album_photos")
    .select("id, uploaded_by")
    .eq("room_id", result.data.roomId)
    .eq("taken_at", result.data.dateKey)
    .in("id", result.data.photoIds);
  const dbPhotos = photos ?? [];

  if (dbPhotos.length !== result.data.photoIds.length) return;
  if (
    role !== "owner" &&
    dbPhotos.some((photo) => photo.uploaded_by !== userId)
  ) {
    return;
  }

  await Promise.all(
    result.data.photoIds.map((photoId, index) =>
      supabase
        .from("album_photos")
        .update({
          sort_order: index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", photoId)
        .eq("room_id", result.data.roomId)
        .eq("taken_at", result.data.dateKey),
    ),
  );

  revalidatePath(getAlbumPath(result.data.roomCode));
}
