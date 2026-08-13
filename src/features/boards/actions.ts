"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  archiveBoardItemSchema,
  createChecklistItemSchema,
  createChecklistSchema,
  createNoteSchema,
  createPollOptionSchema,
  createPollSchema,
  deleteChecklistItemSchema,
  deletePollOptionSchema,
  reorderBoardItemsSchema,
  restoreBoardItemSchema,
  toggleChecklistSchema,
  updateBoardItemSchema,
  updateChecklistItemSchema,
  updatePollOptionSchema,
  updatePollSettingsSchema,
  votePollSchema,
} from "@/features/boards/validation";
import { getRoomSubPath, isRoomCode } from "@/lib/rooms/room-path";
import { createClient } from "@/lib/supabase/server";

export type BoardActionState = {
  error?: string;
  fieldErrors?: {
    title?: string[];
    body?: string[];
    checklistItems?: string[];
    pollVoteMode?: string[];
    pollOptions?: string[];
  };
  success?: boolean;
};

export type BoardMutationState = {
  error?: string;
  success?: boolean;
};

type BoardItemInsert = {
  board_id: string;
  item_type: "note" | "checklist" | "poll";
  title: string;
  body: string | null;
  poll_max_votes_per_user?: number;
  poll_allow_vote_cancel?: boolean;
  z_index?: number;
  created_by: string;
};

/** คืน path ของหน้า board จาก room code ถ้ามี ไม่เช่นนั้น fallback เป็น UUID path */
function getBoardPath(formData: FormData, roomId: string) {
  const roomCode = formData.get("roomCode");
  return typeof roomCode === "string" && isRoomCode(roomCode)
    ? getRoomSubPath(roomCode, "board")
    : `/rooms/${roomId}/board`;
}

/** คืนค่า user id จาก session ปัจจุบัน หรือส่งกลับหน้า login ถ้ายังไม่ได้เข้าสู่ระบบ */
async function requireUserId() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/login");

  return { supabase, userId };
}

/** ซ่อน card ที่สร้างไม่ครบ เพื่อไม่ให้มีข้อมูลค้างเมื่อ insert ตารางย่อยไม่สำเร็จ */
async function archivePartialBoardItem(boardItemId: string) {
  const supabase = await createClient();
  await supabase
    .from("board_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", boardItemId);
}

/** สร้าง card หลักของ board แล้วคืน id สำหรับสร้างข้อมูลย่อยตามประเภท */
async function createBoardItem(payload: BoardItemInsert) {
  const supabase = await createClient();
  const { data: lastItem } = await supabase
    .from("board_items")
    .select("z_index")
    .eq("board_id", payload.board_id)
    .is("archived_at", null)
    .order("z_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  return supabase
    .from("board_items")
    .insert({
      ...payload,
      z_index: payload.z_index ?? (lastItem?.z_index ?? -1) + 1,
    })
    .select("id")
    .single();
}

/** เพิ่ม note card แบบข้อความธรรมดาลงใน board */
export async function createNote(
  _previousState: BoardActionState,
  formData: FormData,
): Promise<BoardActionState> {
  const result = createNoteSchema.safeParse({
    roomId: formData.get("roomId"),
    boardId: formData.get("boardId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { userId } = await requireUserId();
  const { error } = await createBoardItem({
    board_id: result.data.boardId,
    item_type: "note",
    title: result.data.title,
    body: result.data.body,
    created_by: userId,
  });

  if (error) return { error: "เพิ่ม note ไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** เพิ่ม checklist card พร้อมรายการย่อยจาก textarea หนึ่งบรรทัดต่อหนึ่งรายการ */
export async function createChecklist(
  _previousState: BoardActionState,
  formData: FormData,
): Promise<BoardActionState> {
  const result = createChecklistSchema.safeParse({
    roomId: formData.get("roomId"),
    boardId: formData.get("boardId"),
    title: formData.get("title"),
    body: formData.get("body"),
    checklistItems: formData.get("checklistItems"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { supabase, userId } = await requireUserId();
  const { data: item, error: itemError } = await createBoardItem({
    board_id: result.data.boardId,
    item_type: "checklist",
    title: result.data.title,
    body: result.data.body,
    created_by: userId,
  });

  if (itemError || !item) {
    return { error: "เพิ่ม checklist ไม่สำเร็จ: " + itemError?.message };
  }

  const { error: checklistError } = await supabase
    .from("board_checklist_items")
    .insert(
      result.data.checklistItems.map((text, index) => ({
        board_item_id: item.id,
        text,
        sort_order: index,
      })),
    );

  if (checklistError) {
    await archivePartialBoardItem(item.id);
    return {
      error: "เพิ่มรายการ checklist ไม่สำเร็จ: " + checklistError.message,
    };
  }

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** เพิ่ม poll card พร้อมตัวเลือกโหวตจาก textarea หนึ่งบรรทัดต่อหนึ่งตัวเลือก */
export async function createPoll(
  _previousState: BoardActionState,
  formData: FormData,
): Promise<BoardActionState> {
  const result = createPollSchema.safeParse({
    roomId: formData.get("roomId"),
    boardId: formData.get("boardId"),
    title: formData.get("title"),
    body: formData.get("body"),
    pollVoteMode: formData.get("pollVoteMode") ?? "single",
    pollOptions: formData.get("pollOptions"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const { supabase, userId } = await requireUserId();
  const { data: item, error: itemError } = await createBoardItem({
    board_id: result.data.boardId,
    item_type: "poll",
    title: result.data.title,
    body: result.data.body,
    poll_max_votes_per_user: result.data.pollVoteMode === "single" ? 1 : 10,
    poll_allow_vote_cancel: true,
    created_by: userId,
  });

  if (itemError || !item) {
    return { error: "เพิ่ม poll ไม่สำเร็จ: " + itemError?.message };
  }

  const { error: pollError } = await supabase.from("board_poll_options").insert(
    result.data.pollOptions.map((label, index) => ({
      board_item_id: item.id,
      label,
      sort_order: index,
    })),
  );

  if (pollError) {
    await archivePartialBoardItem(item.id);
    return { error: "เพิ่มตัวเลือก poll ไม่สำเร็จ: " + pollError.message };
  }

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** เปลี่ยนสถานะเสร็จ/ไม่เสร็จของ checklist item */
export async function toggleChecklistItem(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = toggleChecklistSchema.safeParse({
    roomId: formData.get("roomId"),
    checklistItemId: formData.get("checklistItemId"),
    isDone: formData.get("isDone"),
  });

  if (!result.success) return { error: "ข้อมูล checklist ไม่ถูกต้อง" };

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_checklist_items")
    .update({ is_done: result.data.isDone })
    .eq("id", result.data.checklistItemId);

  if (error) return { error: "เปลี่ยนสถานะไม่สำเร็จ: " + error.message };

  return { success: true };
}

/** บันทึกหรือยกเลิกคะแนนโหวต โดยยกเลิกโหวตได้เสมอและเคารพจำนวนโหวตสูงสุดของ poll card */
export async function votePollOption(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = votePollSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    optionId: formData.get("optionId"),
  });

  if (!result.success) return { error: "ข้อมูลการโหวตไม่ถูกต้อง" };

  const { supabase, userId } = await requireUserId();

  const { data: poll } = await supabase
    .from("board_items")
    .select("id, poll_max_votes_per_user")
    .eq("id", result.data.boardItemId)
    .eq("item_type", "poll")
    .maybeSingle();

  if (!poll) return { error: "ไม่พบโพลที่ต้องการโหวต" };

  const { data: options } = await supabase
    .from("board_poll_options")
    .select("id")
    .eq("board_item_id", result.data.boardItemId);

  const optionIds = options?.map((option) => option.id) ?? [];
  if (!optionIds.includes(result.data.optionId)) {
    return { error: "ไม่พบตัวเลือกที่ต้องการโหวต" };
  }

  const { data: currentVotes } = await supabase
    .from("board_poll_votes")
    .select("option_id")
    .eq("user_id", userId)
    .in("option_id", optionIds);

  const votedOptionIds = currentVotes?.map((vote) => vote.option_id) ?? [];
  const hasVotedThisOption = votedOptionIds.includes(result.data.optionId);

  if (hasVotedThisOption) {
    const { error } = await supabase
      .from("board_poll_votes")
      .delete()
      .eq("option_id", result.data.optionId)
      .eq("user_id", userId);

    if (error) return { error: "ยกเลิกโหวตไม่สำเร็จ: " + error.message };

    return { success: true };
  }

  if (poll.poll_max_votes_per_user <= 1 && votedOptionIds.length) {
    await supabase
      .from("board_poll_votes")
      .delete()
      .eq("user_id", userId)
      .in("option_id", votedOptionIds);
  }

  if (
    poll.poll_max_votes_per_user > 1 &&
    votedOptionIds.length >= poll.poll_max_votes_per_user
  ) {
    return { error: "คุณใช้จำนวนโหวตครบแล้ว" };
  }

  const { error } = await supabase
    .from("board_poll_votes")
    .upsert(
      { option_id: result.data.optionId, user_id: userId },
      { ignoreDuplicates: true },
    );

  if (error) return { error: "บันทึกโหวตไม่สำเร็จ: " + error.message };

  return { success: true };
}

/** Archive board item แทนการลบจริง เพื่อให้กู้แนวคิดกลับมาได้ในอนาคต */
export async function archiveBoardItem(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = archiveBoardItemSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
  });

  if (!result.success) return { error: "ข้อมูลรายการไม่ถูกต้อง" };

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", result.data.boardItemId);

  if (error) return { error: "เก็บรายการไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** กู้คืน board item ที่เคยจัดเก็บ โดยทำให้กลับมาแสดงบนบอร์ดอีกครั้ง */
export async function restoreBoardItem(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = restoreBoardItemSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
  });

  if (!result.success) return { error: "ข้อมูลรายการไม่ถูกต้อง" };

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_items")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.boardItemId);

  if (error) return { error: "กู้คืนรายการไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** แก้หัวข้อและรายละเอียดของ card หลักโดยไม่เปลี่ยนประเภทของ card */
export async function updateBoardItem(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = updateBoardItemSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_items")
    .update({
      title: result.data.title,
      body: result.data.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.boardItemId);

  if (error) return { error: "บันทึกรายการไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** แก้ข้อความของ checklist item รายการเดียว */
export async function updateChecklistItem(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = updateChecklistItemSchema.safeParse({
    roomId: formData.get("roomId"),
    checklistItemId: formData.get("checklistItemId"),
    text: formData.get("text"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_checklist_items")
    .update({ text: result.data.text })
    .eq("id", result.data.checklistItemId);

  if (error) return { error: "บันทึกรายการไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** แก้ label ของ poll option รายการเดียว */
export async function updatePollOption(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = updatePollOptionSchema.safeParse({
    roomId: formData.get("roomId"),
    optionId: formData.get("optionId"),
    label: formData.get("label"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_poll_options")
    .update({ label: result.data.label })
    .eq("id", result.data.optionId);

  if (error) return { error: "บันทึกตัวเลือกไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** เพิ่มรายการย่อยใหม่ต่อท้าย checklist เดิม */
export async function createChecklistItem(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = createChecklistItemSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    text: formData.get("text"),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { supabase } = await requireUserId();
  const { data: items, error: readError } = await supabase
    .from("board_checklist_items")
    .select("sort_order")
    .eq("board_item_id", result.data.boardItemId)
    .order("sort_order", { ascending: false });
  if (readError) return { error: "อ่านรายการเดิมไม่สำเร็จ" };
  if ((items?.length ?? 0) >= 30) {
    return { error: "Checklist ใส่ได้ไม่เกิน 30 รายการ" };
  }

  const { error } = await supabase.from("board_checklist_items").insert({
    board_item_id: result.data.boardItemId,
    text: result.data.text,
    sort_order: (items?.[0]?.sort_order ?? -1) + 1,
  });
  if (error) return { error: "เพิ่มรายการไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** ลบรายการย่อยออกจาก checklist */
export async function deleteChecklistItem(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = deleteChecklistItemSchema.safeParse({
    roomId: formData.get("roomId"),
    checklistItemId: formData.get("checklistItemId"),
  });
  if (!result.success) return { error: "ข้อมูลรายการไม่ถูกต้อง" };

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_checklist_items")
    .delete()
    .eq("id", result.data.checklistItemId);
  if (error) return { error: "ลบรายการไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** เพิ่มตัวเลือกใหม่ต่อท้าย poll โดยจำกัดไม่เกิน 10 ตัวเลือก */
export async function createPollOption(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = createPollOptionSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    label: formData.get("label"),
  });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { supabase } = await requireUserId();
  const { data: options, error: readError } = await supabase
    .from("board_poll_options")
    .select("sort_order")
    .eq("board_item_id", result.data.boardItemId)
    .order("sort_order", { ascending: false });
  if (readError) return { error: "อ่านตัวเลือกเดิมไม่สำเร็จ" };
  if ((options?.length ?? 0) >= 10) {
    return { error: "Poll ใส่ได้ไม่เกิน 10 ตัวเลือก" };
  }

  const { error } = await supabase.from("board_poll_options").insert({
    board_item_id: result.data.boardItemId,
    label: result.data.label,
    sort_order: (options?.[0]?.sort_order ?? -1) + 1,
  });
  if (error) return { error: "เพิ่มตัวเลือกไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** ลบตัวเลือก poll โดยต้องเหลืออย่างน้อยสองตัวเลือก */
export async function deletePollOption(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = deletePollOptionSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    optionId: formData.get("optionId"),
  });
  if (!result.success) return { error: "ข้อมูลตัวเลือกไม่ถูกต้อง" };

  const { supabase } = await requireUserId();
  const { count, error: countError } = await supabase
    .from("board_poll_options")
    .select("id", { count: "exact", head: true })
    .eq("board_item_id", result.data.boardItemId);
  if (countError) return { error: "ตรวจจำนวนตัวเลือกไม่สำเร็จ" };
  if ((count ?? 0) <= 2) return { error: "Poll ต้องเหลืออย่างน้อย 2 ตัวเลือก" };

  const { error } = await supabase
    .from("board_poll_options")
    .delete()
    .eq("id", result.data.optionId)
    .eq("board_item_id", result.data.boardItemId);
  if (error) return { error: "ลบตัวเลือกไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** เปลี่ยนโหมด poll ระหว่างโหวตข้อเดียวกับโหวตได้หลายข้อ */
export async function updatePollSettings(
  formData: FormData,
): Promise<BoardMutationState> {
  const result = updatePollSettingsSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    pollVoteMode: formData.get("pollVoteMode"),
  });
  if (!result.success) return { error: "โหมดการโหวตไม่ถูกต้อง" };

  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("board_items")
    .update({
      poll_max_votes_per_user: result.data.pollVoteMode === "single" ? 1 : 10,
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.data.boardItemId)
    .eq("item_type", "poll");
  if (error) return { error: "บันทึกโหมดโหวตไม่สำเร็จ: " + error.message };

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}

/** บันทึกลำดับ card บนบอร์ดตามตำแหน่งที่ผู้ใช้ลากวาง */
export async function reorderBoardItems(
  formData: FormData,
): Promise<BoardMutationState> {
  let orderedItemIds: unknown = [];
  try {
    orderedItemIds = JSON.parse(String(formData.get("orderedItemIds") ?? "[]"));
  } catch {
    return { error: "ลำดับ card ไม่ถูกต้อง" };
  }

  const result = reorderBoardItemsSchema.safeParse({
    roomId: formData.get("roomId"),
    boardId: formData.get("boardId"),
    orderedItemIds,
  });
  if (!result.success) {
    return {
      error: result.error.issues[0]?.message ?? "ลำดับ card ไม่ถูกต้อง",
    };
  }

  const { supabase } = await requireUserId();
  const updates = result.data.orderedItemIds.map((id, index) =>
    supabase
      .from("board_items")
      .update({
        z_index: index,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("board_id", result.data.boardId)
      .is("archived_at", null),
  );
  const results = await Promise.all(updates);
  const error = results.find((update) => update.error)?.error;
  if (error) {
    return { error: "บันทึกลำดับบอร์ดไม่สำเร็จ: " + error.message };
  }

  revalidatePath(getBoardPath(formData, result.data.roomId));
  return { success: true };
}
