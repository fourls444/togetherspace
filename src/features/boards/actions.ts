"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  archiveBoardItemSchema,
  createChecklistSchema,
  createNoteSchema,
  createPollSchema,
  toggleChecklistSchema,
  updateBoardItemSchema,
  updateChecklistItemSchema,
  updatePollOptionSchema,
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

type BoardItemInsert = {
  board_id: string;
  item_type: "note" | "checklist" | "poll";
  title: string;
  body: string | null;
  poll_max_votes_per_user?: number;
  poll_allow_vote_cancel?: boolean;
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
  return supabase
    .from("board_items")
    .insert(payload)
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
    return { error: "เพิ่มรายการ checklist ไม่สำเร็จ: " + checklistError.message };
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
export async function toggleChecklistItem(formData: FormData) {
  const result = toggleChecklistSchema.safeParse({
    roomId: formData.get("roomId"),
    checklistItemId: formData.get("checklistItemId"),
    isDone: formData.get("isDone"),
  });

  if (!result.success) return;

  const { supabase } = await requireUserId();
  await supabase
    .from("board_checklist_items")
    .update({ is_done: result.data.isDone })
    .eq("id", result.data.checklistItemId);

  revalidatePath(getBoardPath(formData, result.data.roomId));
}

/** บันทึกหรือยกเลิกคะแนนโหวต โดยยกเลิกโหวตได้เสมอและเคารพจำนวนโหวตสูงสุดของ poll card */
export async function votePollOption(formData: FormData) {
  const result = votePollSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    optionId: formData.get("optionId"),
  });

  if (!result.success) return;

  const { supabase, userId } = await requireUserId();

  const { data: poll } = await supabase
    .from("board_items")
    .select("id, poll_max_votes_per_user")
    .eq("id", result.data.boardItemId)
    .eq("item_type", "poll")
    .maybeSingle();

  if (!poll) return;

  const { data: options } = await supabase
    .from("board_poll_options")
    .select("id")
    .eq("board_item_id", result.data.boardItemId);

  const optionIds = options?.map((option) => option.id) ?? [];
  if (!optionIds.includes(result.data.optionId)) return;

  const { data: currentVotes } = await supabase
    .from("board_poll_votes")
    .select("option_id")
    .eq("user_id", userId)
    .in("option_id", optionIds);

  const votedOptionIds =
    currentVotes?.map((vote) => vote.option_id) ?? [];
  const hasVotedThisOption = votedOptionIds.includes(result.data.optionId);

  if (hasVotedThisOption) {
    await supabase
      .from("board_poll_votes")
      .delete()
      .eq("option_id", result.data.optionId)
      .eq("user_id", userId);

    revalidatePath(getBoardPath(formData, result.data.roomId));
    return;
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
    revalidatePath(getBoardPath(formData, result.data.roomId));
    return;
  }

  await supabase
    .from("board_poll_votes")
    .upsert(
      { option_id: result.data.optionId, user_id: userId },
      { ignoreDuplicates: true },
    );

  revalidatePath(getBoardPath(formData, result.data.roomId));
}

/** Archive board item แทนการลบจริง เพื่อให้กู้แนวคิดกลับมาได้ในอนาคต */
export async function archiveBoardItem(formData: FormData) {
  const result = archiveBoardItemSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
  });

  if (!result.success) return;

  const { supabase } = await requireUserId();
  await supabase
    .from("board_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", result.data.boardItemId);

  revalidatePath(getBoardPath(formData, result.data.roomId));
}

/** แก้หัวข้อและรายละเอียดของ card หลักโดยไม่เปลี่ยนประเภทของ card */
export async function updateBoardItem(formData: FormData) {
  const result = updateBoardItemSchema.safeParse({
    roomId: formData.get("roomId"),
    boardItemId: formData.get("boardItemId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!result.success) return;

  const { supabase } = await requireUserId();
  await supabase
    .from("board_items")
    .update({
      title: result.data.title,
      body: result.data.body,
    })
    .eq("id", result.data.boardItemId);

  revalidatePath(getBoardPath(formData, result.data.roomId));
}

/** แก้ข้อความของ checklist item รายการเดียว */
export async function updateChecklistItem(formData: FormData) {
  const result = updateChecklistItemSchema.safeParse({
    roomId: formData.get("roomId"),
    checklistItemId: formData.get("checklistItemId"),
    text: formData.get("text"),
  });

  if (!result.success) return;

  const { supabase } = await requireUserId();
  await supabase
    .from("board_checklist_items")
    .update({ text: result.data.text })
    .eq("id", result.data.checklistItemId);

  revalidatePath(getBoardPath(formData, result.data.roomId));
}

/** แก้ label ของ poll option รายการเดียว */
export async function updatePollOption(formData: FormData) {
  const result = updatePollOptionSchema.safeParse({
    roomId: formData.get("roomId"),
    optionId: formData.get("optionId"),
    label: formData.get("label"),
  });

  if (!result.success) return;

  const { supabase } = await requireUserId();
  await supabase
    .from("board_poll_options")
    .update({ label: result.data.label })
    .eq("id", result.data.optionId);

  revalidatePath(getBoardPath(formData, result.data.roomId));
}
