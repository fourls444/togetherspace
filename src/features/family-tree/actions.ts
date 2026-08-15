"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createFamilyTreeRelationshipSchema,
  deleteFamilyTreePersonSchema,
  deleteFamilyTreeRelationshipSchema,
  moveFamilyTreePersonSchema,
  upsertFamilyTreePersonSchema,
} from "@/features/family-tree/validation";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";

export type FamilyTreeActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/** คืน user ปัจจุบันสำหรับ action ของผังครอบครัว และส่งกลับไป login ถ้า session หมด */
async function requireFamilyTreeUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

/** ตรวจว่าผู้ใช้เป็นสมาชิกห้องประเภทครอบครัวจริงก่อนอนุญาตแก้ผัง */
async function validateFamilyRoomMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  userId: string,
) {
  const [memberResult, roomResult] = await Promise.all([
    supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("rooms").select("type").eq("id", roomId).maybeSingle(),
  ]);

  return (
    !memberResult.error &&
    !roomResult.error &&
    Boolean(memberResult.data) &&
    roomResult.data?.type === "family"
  );
}

/** ตรวจว่าสมาชิกที่เลือกเป็นคนในห้องเดียวกันจริง */
async function validateRoomMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data);
}

/** ตรวจว่าคนในผังทั้งหมดอยู่ในห้องเดียวกันก่อนสร้างความสัมพันธ์ */
async function validatePeopleInRoom(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  personIds: string[],
) {
  const { data, error } = await supabase
    .from("family_tree_people")
    .select("id")
    .eq("room_id", roomId)
    .in("id", personIds);

  return !error && (data?.length ?? 0) === new Set(personIds).size;
}

/** refresh หน้า family tree หลังบันทึกข้อมูล */
function revalidateFamilyTree(roomCode: string) {
  revalidatePath(getRoomSubPath(roomCode, "family-tree"));
}

/** เพิ่มหรือแก้ไขคนในผังครอบครัว โดยรองรับทั้ง guest และสมาชิกจริงในห้อง */
export async function upsertFamilyTreePerson(
  _previous: FamilyTreeActionState,
  formData: FormData,
): Promise<FamilyTreeActionState> {
  const result = upsertFamilyTreePersonSchema.safeParse({
    avatarUrl: formData.get("avatarUrl"),
    displayName: formData.get("displayName"),
    personId: formData.get("personId"),
    positionX: formData.get("positionX"),
    positionY: formData.get("positionY"),
    role: formData.get("role"),
    roomCode: formData.get("roomCode"),
    roomId: formData.get("roomId"),
    roomMemberUserId: formData.get("roomMemberUserId"),
  });

  if (!result.success) {
    return {
      fieldErrors: result.error.flatten()
        .fieldErrors as Record<string, string[]>,
    };
  }

  const { supabase, userId } = await requireFamilyTreeUser();
  const isFamilyMember = await validateFamilyRoomMember(
    supabase,
    result.data.roomId,
    userId,
  );
  if (!isFamilyMember) return { error: "ผังนี้ใช้ได้เฉพาะสมาชิกห้องครอบครัว" };

  if (result.data.roomMemberUserId) {
    const isSelectedMember = await validateRoomMember(
      supabase,
      result.data.roomId,
      result.data.roomMemberUserId,
    );
    if (!isSelectedMember) return { error: "สมาชิกที่เลือกไม่ได้อยู่ในห้องนี้" };
  }

  const payload = {
    avatar_url: result.data.avatarUrl,
    display_name: result.data.displayName,
    position_x: result.data.positionX,
    position_y: result.data.positionY,
    role: result.data.role,
    room_member_user_id: result.data.roomMemberUserId,
    updated_at: new Date().toISOString(),
  };

  const response = result.data.personId
    ? await supabase
        .from("family_tree_people")
        .update(payload)
        .eq("id", result.data.personId)
        .eq("room_id", result.data.roomId)
    : await supabase.from("family_tree_people").insert({
        ...payload,
        created_by: userId,
        room_id: result.data.roomId,
      });

  if (response.error) {
    return { error: `บันทึกคนในผังไม่สำเร็จ: ${response.error.message}` };
  }

  revalidateFamilyTree(result.data.roomCode);
  return { success: true };
}

/** บันทึกตำแหน่ง card บน canvas หลังผู้ใช้ลากวาง */
export async function moveFamilyTreePerson(
  formData: FormData,
): Promise<FamilyTreeActionState> {
  const result = moveFamilyTreePersonSchema.safeParse({
    personId: formData.get("personId"),
    positionX: formData.get("positionX"),
    positionY: formData.get("positionY"),
    roomCode: formData.get("roomCode"),
    roomId: formData.get("roomId"),
  });
  if (!result.success) return { error: "ตำแหน่งในผังไม่ถูกต้อง" };

  const { supabase, userId } = await requireFamilyTreeUser();
  if (!(await validateFamilyRoomMember(supabase, result.data.roomId, userId))) {
    return { error: "ผังนี้ใช้ได้เฉพาะสมาชิกห้องครอบครัว" };
  }

  const { error } = await supabase
    .from("family_tree_people")
    .update({
      position_x: result.data.positionX,
      position_y: result.data.positionY,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.personId)
    .eq("room_id", result.data.roomId);

  if (error) return { error: `ย้ายตำแหน่งไม่สำเร็จ: ${error.message}` };
  revalidateFamilyTree(result.data.roomCode);
  return { success: true };
}

/** ลบคนออกจากผัง โดยความสัมพันธ์ของคนนั้นจะถูกลบตาม foreign key */
export async function deleteFamilyTreePerson(
  formData: FormData,
): Promise<FamilyTreeActionState> {
  const result = deleteFamilyTreePersonSchema.safeParse({
    personId: formData.get("personId"),
    roomCode: formData.get("roomCode"),
    roomId: formData.get("roomId"),
  });
  if (!result.success) return { error: "ข้อมูลคนในผังไม่ถูกต้อง" };

  const { supabase, userId } = await requireFamilyTreeUser();
  if (!(await validateFamilyRoomMember(supabase, result.data.roomId, userId))) {
    return { error: "ผังนี้ใช้ได้เฉพาะสมาชิกห้องครอบครัว" };
  }

  const { error } = await supabase
    .from("family_tree_people")
    .delete()
    .eq("id", result.data.personId)
    .eq("room_id", result.data.roomId);

  if (error) return { error: `ลบคนในผังไม่สำเร็จ: ${error.message}` };
  revalidateFamilyTree(result.data.roomCode);
  return { success: true };
}

/** เพิ่มเส้นความสัมพันธ์ parent-child หรือ sibling ระหว่างคนสองคน */
export async function createFamilyTreeRelationship(
  _previous: FamilyTreeActionState,
  formData: FormData,
): Promise<FamilyTreeActionState> {
  const result = createFamilyTreeRelationshipSchema.safeParse({
    fromPersonId: formData.get("fromPersonId"),
    relationshipType: formData.get("relationshipType"),
    roomCode: formData.get("roomCode"),
    roomId: formData.get("roomId"),
    toPersonId: formData.get("toPersonId"),
  });

  if (!result.success) {
    return {
      fieldErrors: result.error.flatten()
        .fieldErrors as Record<string, string[]>,
    };
  }

  const { supabase, userId } = await requireFamilyTreeUser();
  if (!(await validateFamilyRoomMember(supabase, result.data.roomId, userId))) {
    return { error: "ผังนี้ใช้ได้เฉพาะสมาชิกห้องครอบครัว" };
  }
  if (
    !(await validatePeopleInRoom(supabase, result.data.roomId, [
      result.data.fromPersonId,
      result.data.toPersonId,
    ]))
  ) {
    return { error: "คนที่เลือกต้องอยู่ในผังเดียวกัน" };
  }

  const { error } = await supabase.from("family_tree_relationships").insert({
    created_by: userId,
    from_person_id: result.data.fromPersonId,
    relationship_type: result.data.relationshipType,
    room_id: result.data.roomId,
    to_person_id: result.data.toPersonId,
  });

  if (error) {
    return { error: `เพิ่มความสัมพันธ์ไม่สำเร็จ: ${error.message}` };
  }

  revalidateFamilyTree(result.data.roomCode);
  return { success: true };
}

/** ลบเส้นความสัมพันธ์ออกจากผัง */
export async function deleteFamilyTreeRelationship(
  formData: FormData,
): Promise<FamilyTreeActionState> {
  const result = deleteFamilyTreeRelationshipSchema.safeParse({
    relationshipId: formData.get("relationshipId"),
    roomCode: formData.get("roomCode"),
    roomId: formData.get("roomId"),
  });
  if (!result.success) return { error: "ข้อมูลความสัมพันธ์ไม่ถูกต้อง" };

  const { supabase, userId } = await requireFamilyTreeUser();
  if (!(await validateFamilyRoomMember(supabase, result.data.roomId, userId))) {
    return { error: "ผังนี้ใช้ได้เฉพาะสมาชิกห้องครอบครัว" };
  }

  const { error } = await supabase
    .from("family_tree_relationships")
    .delete()
    .eq("id", result.data.relationshipId)
    .eq("room_id", result.data.roomId);

  if (error) return { error: `ลบความสัมพันธ์ไม่สำเร็จ: ${error.message}` };
  revalidateFamilyTree(result.data.roomCode);
  return { success: true };
}
