import styles from "@/app/(app)/rooms/[roomId]/board/board.module.css";
import {
  BoardItemList,
  type BoardItemView,
} from "@/components/boards/board-item-list";
import { BoardCreateForms } from "@/components/boards/board-create-forms";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { GlowCard } from "@/components/ui/glow-card";
import { getBoardCopy } from "@/lib/boards/board-copy";
import { getRoomContext } from "@/lib/rooms/server";

/** บอร์ดของห้อง — โน้ต เช็คลิสต์ โพล */
export default async function RoomBoardPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.stack}>
        <ErrorState
          description="ถ้าต้องการเปิดบอร์ดนี้ กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  const { currentUserId, room, roomCode, roomId, supabase } = context;
  const boardCopy = getBoardCopy(room.type);

  const { data: boardId, error: boardError } = await supabase.rpc(
    "ensure_room_board",
    { p_room_id: roomId },
  );

  if (boardError || !boardId) {
    return (
      <ErrorState
        description="กรุณาลองอีกครั้งในอีกสักครู่"
        headingLevel={1}
        title="เปิดบอร์ดไม่สำเร็จ"
      />
    );
  }

  const itemsResult = await supabase
    .from("board_items")
    .select("id, item_type, title, body, created_at, poll_max_votes_per_user")
    .eq("board_id", boardId)
    .is("archived_at", null)
    .order("z_index")
    .order("created_at", { ascending: false });

  const rawItems = itemsResult.data ?? [];
  const itemIds = rawItems.map((item) => item.id);

  const [checklistResult, pollOptionsResult] = await Promise.all([
    itemIds.length
      ? supabase
          .from("board_checklist_items")
          .select("id, board_item_id, text, is_done, sort_order")
          .in("board_item_id", itemIds)
          .order("sort_order")
      : Promise.resolve({ data: [] as never[] }),
    itemIds.length
      ? supabase
          .from("board_poll_options")
          .select("id, board_item_id, label, sort_order")
          .in("board_item_id", itemIds)
          .order("sort_order")
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const optionIds = pollOptionsResult.data?.map((option) => option.id) ?? [];
  const votesResult = optionIds.length
    ? await supabase
        .from("board_poll_votes")
        .select("option_id, user_id")
        .in("option_id", optionIds)
    : { data: [] };

  const checklistByItem = new Map<string, BoardItemView["checklistItems"]>();
  for (const item of checklistResult.data ?? []) {
    const list = checklistByItem.get(item.board_item_id) ?? [];
    list.push({
      id: item.id,
      text: item.text,
      isDone: item.is_done,
      sortOrder: item.sort_order,
    });
    checklistByItem.set(item.board_item_id, list);
  }

  const votesByOption = new Map<
    string,
    { count: number; currentUser: boolean }
  >();
  for (const vote of votesResult.data ?? []) {
    const current = votesByOption.get(vote.option_id) ?? {
      count: 0,
      currentUser: false,
    };
    current.count += 1;
    current.currentUser = current.currentUser || vote.user_id === currentUserId;
    votesByOption.set(vote.option_id, current);
  }

  const pollOptionsByItem = new Map<string, BoardItemView["pollOptions"]>();
  for (const option of pollOptionsResult.data ?? []) {
    const votes = votesByOption.get(option.id) ?? {
      count: 0,
      currentUser: false,
    };
    const list = pollOptionsByItem.get(option.board_item_id) ?? [];
    list.push({
      id: option.id,
      label: option.label,
      sortOrder: option.sort_order,
      voteCount: votes.count,
      votedByCurrentUser: votes.currentUser,
    });
    pollOptionsByItem.set(option.board_item_id, list);
  }

  const items: BoardItemView[] = rawItems.map((item) => ({
    id: item.id,
    itemType: item.item_type,
    title: item.title,
    body: item.body,
    createdAt: item.created_at,
    pollMaxVotesPerUser: item.poll_max_votes_per_user,
    checklistItems: checklistByItem.get(item.id) ?? [],
    pollOptions: pollOptionsByItem.get(item.id) ?? [],
  }));

  return (
    <div className={styles.stack}>
      <GlowCard contentClassName={styles.panel} roomType={room.type} tone="room">
        <h2 className={styles.title}>{boardCopy.pageTitle}</h2>
        <p className={styles.lead}>{boardCopy.lead}</p>
        <BoardCreateForms
          boardId={boardId}
          roomType={room.type}
          roomCode={roomCode}
          roomId={roomId}
        />
      </GlowCard>
      <GlowCard contentClassName={styles.panel} roomType={room.type} tone="room">
        <h2 className={styles.title}>{boardCopy.panelTitle}</h2>
        <BoardItemList
          boardId={boardId}
          items={items}
          roomType={room.type}
          roomCode={roomCode}
          roomId={roomId}
        />
      </GlowCard>
    </div>
  );
}
