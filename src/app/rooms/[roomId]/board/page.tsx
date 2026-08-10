import Link from "next/link";

import styles from "@/app/rooms/[roomId]/board/board.module.css";
import {
  BoardItemList,
  type BoardItemView,
} from "@/components/boards/board-item-list";
import { BoardCreateForms } from "@/components/boards/board-create-forms";
import { PageShell } from "@/components/layout/page-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Panel } from "@/components/ui/panel";
import { getRoomContext } from "@/lib/rooms/server";

export const dynamic = "force-dynamic";

/** หน้า Board MVP ของห้อง รองรับ note, checklist และ poll แบบยังไม่ realtime */
export default async function RoomBoardPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.container}>
        <Sidebar rooms={context.sidebarRooms} />
        <PageShell>
          <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>
          <div className={styles.error}>
            <ErrorState
              description="ถ้าต้องการเปิดบอร์ดนี้ กรุณาเข้าร่วมห้องก่อน"
              headingLevel={1}
              title="คุณไม่ได้อยู่ในห้องนี้"
            />
          </div>
        </PageShell>
      </div>
    );
  }

  const { currentUserId, room, roomCode, roomId, roomPath, sidebarRooms, supabase } =
    context;

  const { data: boardId, error: boardError } = await supabase.rpc(
    "ensure_room_board",
    {
      p_room_id: roomId,
    },
  );

  if (boardError || !boardId) {
    return (
      <div className={styles.container}>
        <Sidebar rooms={sidebarRooms} />
        <PageShell>
          <div className={styles.error}>
            <ErrorState
              description="กรุณาตรวจสิทธิ์สมาชิกห้องและลองอีกครั้ง"
              headingLevel={1}
              title="เปิดบอร์ดไม่สำเร็จ"
            />
          </div>
        </PageShell>
      </div>
    );
  }

  const itemsResult = await supabase
    .from("board_items")
    .select(
      "id, item_type, title, body, created_at, poll_max_votes_per_user",
    )
    .eq("board_id", boardId)
    .is("archived_at", null)
    .order("z_index")
    .order("created_at", { ascending: false });

  const rawItems = itemsResult.data ?? [];
  const itemIds = rawItems.map((item) => item.id);

  const checklistResult = itemIds.length
    ? await supabase
        .from("board_checklist_items")
        .select("id, board_item_id, text, is_done, sort_order")
        .in("board_item_id", itemIds)
        .order("sort_order")
    : { data: [] };

  const pollOptionsResult = itemIds.length
    ? await supabase
        .from("board_poll_options")
        .select("id, board_item_id, label, sort_order")
        .in("board_item_id", itemIds)
        .order("sort_order")
    : { data: [] };

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

  const votesByOption = new Map<string, { count: number; currentUser: boolean }>();
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
    <div className={styles.container}>
      <Sidebar rooms={sidebarRooms} />
      <PageShell>
        <Link className={styles.backLink} href={roomPath}>
          ← กลับไปหน้าห้อง ({room.name})
        </Link>

        <Panel as="header" className={styles.headerPanel}>
          <div className={styles.headerContent}>
            <div>
              <p className={styles.eyebrow}>Board</p>
              <h1 className={styles.title}>บอร์ดของ {room.name}</h1>
              <p className={styles.description}>
                เก็บ note, checklist และ poll ของห้องไว้ในที่เดียว
              </p>
            </div>
            <Badge>{room.type}</Badge>
          </div>
        </Panel>

        <Panel className={styles.createPanel}>
          <h2 className={styles.sectionTitle}>เพิ่มลงบอร์ด</h2>
          <BoardCreateForms boardId={boardId} roomCode={roomCode} roomId={roomId} />
        </Panel>

        <Panel className={styles.itemsPanel}>
          <h2 className={styles.sectionTitle}>รายการบนบอร์ด</h2>
          <BoardItemList items={items} roomCode={roomCode} roomId={roomId} />
        </Panel>
      </PageShell>
    </div>
  );
}
