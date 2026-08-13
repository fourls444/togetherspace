"use client";

import {
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, RotateCcw, Save } from "lucide-react";

import {
  createChecklistItem,
  createPollOption,
  deleteChecklistItem,
  deletePollOption,
  toggleChecklistItem,
  updateBoardItem,
  updateChecklistItem,
  updatePollOption,
  updatePollSettings,
  votePollOption,
  reorderBoardItems as saveBoardItemOrder,
  restoreBoardItem,
  type BoardMutationState,
} from "@/features/boards/actions";
import { ArchiveBoardItemButton } from "@/components/boards/archive-board-item-button";
import {
  getPollOptionPercent,
  getBoardFilterCounts,
  getVisibleBoardItems,
  reorderBoardItems,
  toggleChecklistState,
  togglePollVoteState,
  type BoardFilter,
} from "@/components/boards/board-interaction-state";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import formStyles from "@/components/ui/form.module.css";
import { parseBoardBody, type BoardBodyBlock } from "@/lib/boards/board-body";
import { getBoardCopy, type BoardCopy } from "@/lib/boards/board-copy";
import type { BoardItemType, RoomType } from "@/lib/types/database";
import styles from "@/components/boards/board-item-list.module.css";

export type BoardItemView = {
  id: string;
  itemType: BoardItemType;
  title: string;
  body: string | null;
  createdAt: string;
  archivedAt: string | null;
  pollMaxVotesPerUser: number;
  checklistItems: {
    id: string;
    text: string;
    isDone: boolean;
    sortOrder: number;
  }[];
  pollOptions: {
    id: string;
    label: string;
    sortOrder: number;
    voteCount: number;
    votedByCurrentUser: boolean;
  }[];
};

type BoardItemListProps = {
  boardId: string;
  items: BoardItemView[];
  roomCode: string;
  roomId: string;
  roomType: RoomType;
};

type PendingDelete =
  | {
      boardItemId?: never;
      id: string;
      kind: "checklist";
      label: string;
    }
  | {
      boardItemId: string;
      id: string;
      kind: "poll";
      label: string;
    };

/** แสดงรายการบนบอร์ด แยกตามโน้ต / รายการ / โพล */
export function BoardItemList({
  boardId,
  items,
  roomCode,
  roomId,
  roomType,
}: BoardItemListProps) {
  const [isPending, startTransition] = useTransition();
  const [localItems, setLocalItems] = useState(items);
  const [sourceItems, setSourceItems] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const copy = getBoardCopy(roomType);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [activeFilter, setActiveFilter] = useState<BoardFilter>("all");

  if (sourceItems !== items) {
    setSourceItems(items);
    setLocalItems(items);
  }

  const filterCounts = getBoardFilterCounts(localItems);
  const visibleItems = getVisibleBoardItems(localItems, activeFilter);
  const isArchiveView = activeFilter === "archived";
  const canReorder = activeFilter === "all";

  if (!items.length) {
    return (
      <div className={styles.empty}>
        <h2>{copy.empty.title}</h2>
        <p>{copy.empty.description}</p>
        <div aria-label="ไอเดียเริ่มต้นสำหรับบอร์ด" className={styles.starters}>
          {copy.starterSuggestions.map((suggestion) => (
            <div
              className={styles.starterCard}
              data-type={suggestion.type}
              key={suggestion.title}
            >
              <span>{copy.itemTypeLabels[suggestion.type]}</span>
              <strong>{suggestion.title}</strong>
              <p>{suggestion.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /** เรียก Server Action จากฟอร์มและแสดงผลลัพธ์ใน toast รูปแบบเดียวกัน */
  function runMutation(
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<BoardMutationState>,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setToast({ message: result.error, tone: "error" });
        return;
      }
      form.reset();
      setToast({ message: successMessage, tone: "success" });
      onSuccess?.();
    });
  }

  /** ลบรายการย่อยตามชนิดหลังผู้ใช้ยืนยัน */
  function confirmChildDelete() {
    if (!pendingDelete) return;
    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);

    const action =
      pendingDelete.kind === "checklist"
        ? deleteChecklistItem
        : deletePollOption;
    if (pendingDelete.kind === "checklist") {
      formData.set("checklistItemId", pendingDelete.id);
    } else {
      formData.set("boardItemId", pendingDelete.boardItemId);
      formData.set("optionId", pendingDelete.id);
    }

    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setPendingDelete(null);
        setToast({ message: result.error, tone: "error" });
        return;
      }
      setPendingDelete(null);
      setToast({ message: "ลบรายการแล้ว", tone: "success" });
    });
  }

  /** เปลี่ยน checklist ทันทีและย้อนค่าเดิมเมื่อบันทึกไม่สำเร็จ */
  function handleChecklistToggle(boardItemId: string, checklistItemId: string) {
    const previousItems = localItems;
    const nextItems = toggleChecklistState(
      localItems,
      boardItemId,
      checklistItemId,
    );
    const nextChecklistItem = nextItems
      .find((item) => item.id === boardItemId)
      ?.checklistItems.find((item) => item.id === checklistItemId);
    if (!nextChecklistItem) return;

    setLocalItems(nextItems);
    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("checklistItemId", checklistItemId);
    formData.set("isDone", String(nextChecklistItem.isDone));

    startTransition(async () => {
      const result = await toggleChecklistItem(formData);
      if (result.error) {
        setLocalItems(previousItems);
        setToast({ message: result.error, tone: "error" });
      }
    });
  }

  /** เปลี่ยนคะแนนโหวตทันทีและย้อนค่าเดิมเมื่อบันทึกไม่สำเร็จ */
  function handlePollVote(boardItemId: string, optionId: string) {
    const previousItems = localItems;
    const nextItems = togglePollVoteState(localItems, boardItemId, optionId);
    if (nextItems === localItems) return;

    setLocalItems(nextItems);
    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("boardItemId", boardItemId);
    formData.set("optionId", optionId);

    startTransition(async () => {
      const result = await votePollOption(formData);
      if (result.error) {
        setLocalItems(previousItems);
        setToast({ message: result.error, tone: "error" });
      }
    });
  }

  /** จัดลำดับ card แบบ optimistic แล้วบันทึก z_index ลงฐานข้อมูล */
  function handleDragEnd(event: DragEndEvent) {
    if (!canReorder) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousItems = localItems;
    const nextItems = arrayMove(localItems, oldIndex, newIndex);
    const orderedItemIds = reorderBoardItems(
      nextItems,
      nextItems.map((item) => item.id),
    ).map((item) => item.id);

    setLocalItems(nextItems);

    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("boardId", boardId);
    formData.set("orderedItemIds", JSON.stringify(orderedItemIds));

    startTransition(async () => {
      const result = await saveBoardItemOrder(formData);
      if (result.error) {
        setLocalItems(previousItems);
        setToast({ message: result.error, tone: "error" });
        return;
      }
      setToast({ message: "จัดลำดับบอร์ดแล้ว", tone: "success" });
    });
  }

  /** กู้คืน card จากแท็บจัดเก็บแบบ optimistic แล้วค่อยบันทึกกลับฐานข้อมูล */
  function handleRestore(boardItemId: string) {
    const previousItems = localItems;
    setLocalItems((currentItems) =>
      currentItems.map((item) =>
        item.id === boardItemId ? { ...item, archivedAt: null } : item,
      ),
    );

    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("boardItemId", boardItemId);

    startTransition(async () => {
      const result = await restoreBoardItem(formData);
      if (result.error) {
        setLocalItems(previousItems);
        setToast({ message: result.error, tone: "error" });
        return;
      }
      setToast({ message: "กู้คืนรายการกลับมาบนบอร์ดแล้ว", tone: "success" });
    });
  }

  return (
    <section aria-label="รายการบนบอร์ด" className={styles.shell}>
      <div className={styles.filters} role="tablist" aria-label="กรองรายการบอร์ด">
        <BoardFilterButton
          activeFilter={activeFilter}
          count={filterCounts.all}
          label="ทั้งหมด"
          onSelect={setActiveFilter}
          value="all"
        />
        <BoardFilterButton
          activeFilter={activeFilter}
          count={filterCounts.note}
          label={copy.itemTypeLabels.note}
          onSelect={setActiveFilter}
          value="note"
        />
        <BoardFilterButton
          activeFilter={activeFilter}
          count={filterCounts.checklist}
          label={copy.itemTypeLabels.checklist}
          onSelect={setActiveFilter}
          value="checklist"
        />
        <BoardFilterButton
          activeFilter={activeFilter}
          count={filterCounts.poll}
          label={copy.itemTypeLabels.poll}
          onSelect={setActiveFilter}
          value="poll"
        />
        <BoardFilterButton
          activeFilter={activeFilter}
          count={filterCounts.archived}
          label="จัดเก็บ"
          onSelect={setActiveFilter}
          value="archived"
        />
      </div>

      {visibleItems.length ? (
        isArchiveView ? (
          <div className={styles.grid}>
            {visibleItems.map((item) => (
              <article
                className={styles.card}
                data-archived="true"
                data-type={item.itemType}
                key={item.id}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.type}>
                      {copy.itemTypeLabels[item.itemType]}
                    </p>
                    <h2 className={styles.title}>{item.title}</h2>
                  </div>
                  <div className={styles.cardActions}>
                    <Button
                      disabled={isPending}
                      onClick={() => handleRestore(item.id)}
                      type="button"
                      variant="primary"
                    >
                      <RotateCcw aria-hidden size={15} /> กู้คืน
                    </Button>
                  </div>
                </div>
                {item.body ? <BoardBody body={item.body} /> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            <DndContext
              id={`board-items-${boardId}`}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={visibleItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {visibleItems.map((item) => (
            <SortableBoardCard disabled={!canReorder} item={item} key={item.id}>
              {({ attributes, listeners, setActivatorNodeRef }) => (
                <>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.type}>
                        {copy.itemTypeLabels[item.itemType]}
                      </p>
                      <h2 className={styles.title}>{item.title}</h2>
                    </div>
                    <div className={styles.cardActions}>
                      {canReorder ? (
                        <button
                          {...attributes}
                          {...listeners}
                          className={styles.dragHandle}
                          ref={setActivatorNodeRef}
                          type="button"
                          aria-label={`ลากเพื่อจัดลำดับ ${item.title}`}
                        >
                          <GripVertical aria-hidden size={16} />
                        </button>
                      ) : null}
                      <Button
                        onClick={() => setEditingItemId(item.id)}
                        type="button"
                      >
                        <Pencil aria-hidden size={15} /> แก้ไข
                      </Button>
                      <ArchiveBoardItemButton
                        boardItemId={item.id}
                        roomCode={roomCode}
                        roomId={roomId}
                        title={item.title}
                        onArchived={() =>
                          setLocalItems((currentItems) =>
                            currentItems.map((currentItem) =>
                              currentItem.id === item.id
                                ? {
                                    ...currentItem,
                                    archivedAt: new Date().toISOString(),
                                  }
                                : currentItem,
                            ),
                          )
                        }
                        onResult={(message, tone) =>
                          setToast({ message, tone })
                        }
                      />
                    </div>
                  </div>

                  {item.body ? <BoardBody body={item.body} /> : null}

                  {item.itemType === "checklist" ? (
                    <ChecklistItems
                      boardItemId={item.id}
                      items={item.checklistItems}
                      isPending={isPending}
                      manage={false}
                      onDelete={(id, label) =>
                        setPendingDelete({ id, kind: "checklist", label })
                      }
                      onToggle={(checklistItemId) =>
                        handleChecklistToggle(item.id, checklistItemId)
                      }
                      runMutation={runMutation}
                      roomCode={roomCode}
                      roomId={roomId}
                    />
                  ) : null}

                  {item.itemType === "poll" ? (
                    <PollOptions
                      isPending={isPending}
                      item={item}
                      manage={false}
                      onDelete={(id, label) =>
                        setPendingDelete({
                          boardItemId: item.id,
                          id,
                          kind: "poll",
                          label,
                        })
                      }
                      onVote={(optionId) => handlePollVote(item.id, optionId)}
                      roomCode={roomCode}
                      roomId={roomId}
                      runMutation={runMutation}
                    />
                  ) : null}
                </>
              )}
            </SortableBoardCard>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )
      ) : (
        <div className={styles.filteredEmpty}>
          <h2>{activeFilter === "archived" ? "ยังไม่มีรายการที่จัดเก็บ" : "ยังไม่มีรายการในหมวดนี้"}</h2>
          <p>
            {activeFilter === "archived"
              ? "รายการที่กดจัดเก็บจะมาอยู่ตรงนี้ และสามารถกู้คืนกลับไปบนบอร์ดได้"
              : "ลองเลือกหมวดอื่น หรือเพิ่มรายการใหม่จากปุ่มด้านบน"}
          </p>
        </div>
      )}
      <BoardEditModal
        item={localItems.find((item) => item.id === editingItemId) ?? null}
        copy={copy}
        isPending={isPending}
        onClose={() => setEditingItemId(null)}
        onChecklistDelete={(id, label) =>
          setPendingDelete({ id, kind: "checklist", label })
        }
        onChecklistToggle={(boardItemId, checklistItemId) =>
          handleChecklistToggle(boardItemId, checklistItemId)
        }
        onPollDelete={(boardItemId, id, label) =>
          setPendingDelete({ boardItemId, id, kind: "poll", label })
        }
        onPollVote={(boardItemId, optionId) =>
          handlePollVote(boardItemId, optionId)
        }
        roomCode={roomCode}
        roomId={roomId}
        runMutation={runMutation}
      />
      <ConfirmationDialog
        confirmLabel="ลบรายการ"
        description={
          pendingDelete
            ? `“${pendingDelete.label}” จะถูกลบและไม่สามารถกู้คืนได้`
            : ""
        }
        isPending={isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmChildDelete}
        open={Boolean(pendingDelete)}
        title="ลบรายการนี้?"
        variant="danger"
      />
      <Toast
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        tone={toast?.tone}
      />
    </section>
  );
}

function BoardFilterButton({
  activeFilter,
  count,
  label,
  onSelect,
  value,
}: {
  activeFilter: BoardFilter;
  count: number;
  label: string;
  onSelect: (filter: BoardFilter) => void;
  value: BoardFilter;
}) {
  const selected = activeFilter === value;

  return (
    <button
      aria-selected={selected}
      className={styles.filterButton}
      data-active={selected ? "true" : undefined}
      onClick={() => onSelect(value)}
      role="tab"
      type="button"
    >
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

/** ครอบ card ให้ลากเรียงลำดับได้ โดยคงเนื้อหาด้านในเหมือน card ปกติ */
function SortableBoardCard({
  children,
  disabled,
  item,
}: {
  children: (handleProps: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
    setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"];
  }) => ReactNode;
  disabled?: boolean;
  item: BoardItemView;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ disabled, id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={styles.card}
      data-dragging={isDragging ? "true" : undefined}
      data-type={item.itemType}
      ref={setNodeRef}
      style={style}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </article>
  );
}

/** แสดงรายละเอียดของ card โดยรองรับย่อหน้า bullet และ numbered list แบบง่าย */
function BoardBody({ body }: { body: string }) {
  const blocks = parseBoardBody(body);
  if (!blocks.length) return null;

  return (
    <div className={styles.body}>
      {blocks.map((block, index) => (
        <BoardBodyBlockView block={block} key={`${block.type}-${index}`} />
      ))}
    </div>
  );
}

/** แสดง block รายละเอียดหนึ่งก้อนตามชนิดที่ parser อ่านได้ */
function BoardBodyBlockView({ block }: { block: BoardBodyBlock }) {
  if (block.type === "p") return <p>{block.text}</p>;

  const ListTag = block.type;
  return (
    <ListTag>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ListTag>
  );
}

type RunMutation = (
  event: FormEvent<HTMLFormElement>,
  action: (formData: FormData) => Promise<BoardMutationState>,
  successMessage: string,
  onSuccess?: () => void,
) => void;

/** รวมการแก้ไขหัวข้อและรายการย่อยไว้ใน modal เพื่อลดความรกบนการ์ดบอร์ด */
function BoardEditModal({
  item,
  copy,
  isPending,
  onChecklistDelete,
  onChecklistToggle,
  onClose,
  onPollDelete,
  onPollVote,
  roomCode,
  roomId,
  runMutation,
}: {
  item: BoardItemView | null;
  copy: BoardCopy;
  isPending: boolean;
  onChecklistDelete: (id: string, label: string) => void;
  onChecklistToggle: (boardItemId: string, checklistItemId: string) => void;
  onClose: () => void;
  onPollDelete: (boardItemId: string, id: string, label: string) => void;
  onPollVote: (boardItemId: string, optionId: string) => void;
  roomCode: string;
  roomId: string;
  runMutation: RunMutation;
}) {
  if (!item) return null;

  return (
    <Modal
      description="แก้ไขเนื้อหาและตัวเลือกของรายการนี้ได้จากจุดเดียว"
      isOpen
      onClose={onClose}
      size="lg"
      title={`แก้ไข${copy.itemTypeLabels[item.itemType]}`}
    >
      <div className={styles.modalContent}>
        <form
          className={styles.editForm}
          onSubmit={(event) =>
            runMutation(event, updateBoardItem, "บันทึกรายการแล้ว", onClose)
          }
        >
          <input name="roomId" type="hidden" value={roomId} />
          <input name="roomCode" type="hidden" value={roomCode} />
          <input name="boardItemId" type="hidden" value={item.id} />
          <label className={formStyles.label} htmlFor={`${item.id}-title`}>
            หัวข้อ
          </label>
          <input
            className={formStyles.control}
            defaultValue={item.title}
            id={`${item.id}-title`}
            maxLength={120}
            name="title"
            required
          />
          <label className={formStyles.label} htmlFor={`${item.id}-body`}>
            รายละเอียด
          </label>
          <textarea
            className={formStyles.control}
            defaultValue={item.body ?? ""}
            id={`${item.id}-body`}
            maxLength={1000}
            name="body"
            rows={3}
          />
          <div className={styles.modalSaveRow}>
            <Button pending={isPending} type="submit" variant="primary">
              <Save aria-hidden size={16} /> บันทึกเนื้อหา
            </Button>
          </div>
        </form>

        {item.itemType === "checklist" ? (
          <section className={styles.manageSection}>
            <h3>จัดการรายการ</h3>
            <ChecklistItems
              boardItemId={item.id}
              items={item.checklistItems}
              isPending={isPending}
              manage
              onDelete={onChecklistDelete}
              onToggle={(checklistItemId) =>
                onChecklistToggle(item.id, checklistItemId)
              }
              runMutation={runMutation}
              roomCode={roomCode}
              roomId={roomId}
            />
          </section>
        ) : null}

        {item.itemType === "poll" ? (
          <section className={styles.manageSection}>
            <h3>จัดการตัวเลือกโพล</h3>
            <PollOptions
              isPending={isPending}
              item={item}
              manage
              onDelete={(id, label) => onPollDelete(item.id, id, label)}
              onVote={(optionId) => onPollVote(item.id, optionId)}
              roomCode={roomCode}
              roomId={roomId}
              runMutation={runMutation}
            />
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

function ChecklistItems({
  boardItemId,
  items,
  isPending,
  manage,
  onDelete,
  onToggle,
  roomCode,
  roomId,
  runMutation,
}: {
  boardItemId: string;
  items: BoardItemView["checklistItems"];
  isPending: boolean;
  manage: boolean;
  onDelete: (id: string, label: string) => void;
  onToggle: (id: string) => void;
  roomCode: string;
  roomId: string;
  runMutation: RunMutation;
}) {
  return (
    <ul className={styles.checklist}>
      {items.map((item) => (
        <li className={styles.checklistItem} key={item.id}>
          <button
            aria-label={
              item.isDone ? "ยกเลิกสถานะเสร็จแล้ว" : "ทำเครื่องหมายว่าเสร็จแล้ว"
            }
            className={styles.checkboxButton}
            disabled={isPending}
            onClick={() => onToggle(item.id)}
            title={item.isDone ? "ยกเลิก" : "ทำเสร็จ"}
            type="button"
          >
            {item.isDone ? "✓" : ""}
          </button>
          <span className={item.isDone ? styles.doneText : ""}>
            {item.text}
          </span>
          {manage ? (
            <>
              <details className={styles.inlineEdit}>
                <summary>แก้ไข</summary>
                <form
                  className={styles.inlineEditForm}
                  onSubmit={(event) =>
                    runMutation(event, updateChecklistItem, "แก้ไขรายการแล้ว")
                  }
                >
                  <input name="roomId" type="hidden" value={roomId} />
                  <input name="roomCode" type="hidden" value={roomCode} />
                  <input name="checklistItemId" type="hidden" value={item.id} />
                  <input
                    className={formStyles.control}
                    defaultValue={item.text}
                    maxLength={200}
                    name="text"
                    required
                  />
                  <Button pending={isPending} type="submit">
                    บันทึก
                  </Button>
                </form>
              </details>
              <Button
                disabled={isPending}
                onClick={() => onDelete(item.id, item.text)}
                type="button"
                variant="danger"
              >
                ลบ
              </Button>
            </>
          ) : null}
        </li>
      ))}
      {manage ? (
        <li>
          <form
            className={styles.addInlineForm}
            onSubmit={(event) =>
              runMutation(event, createChecklistItem, "เพิ่มรายการแล้ว")
            }
          >
            <input name="roomId" type="hidden" value={roomId} />
            <input name="roomCode" type="hidden" value={roomCode} />
            <input name="boardItemId" type="hidden" value={boardItemId} />
            <input
              className={formStyles.control}
              maxLength={200}
              name="text"
              placeholder="เพิ่มรายการใหม่"
              required
            />
            <Button pending={isPending} type="submit">
              เพิ่มรายการ
            </Button>
          </form>
        </li>
      ) : null}
    </ul>
  );
}

function PollOptions({
  item,
  isPending,
  manage,
  onDelete,
  onVote,
  roomCode,
  roomId,
  runMutation,
}: {
  isPending: boolean;
  item: BoardItemView;
  manage: boolean;
  onDelete: (id: string, label: string) => void;
  onVote: (id: string) => void;
  roomCode: string;
  roomId: string;
  runMutation: RunMutation;
}) {
  const selectedCount = item.pollOptions.filter(
    (option) => option.votedByCurrentUser,
  ).length;
  const totalVotes = item.pollOptions.reduce(
    (sum, option) => sum + option.voteCount,
    0,
  );
  const isMultipleVote = item.pollMaxVotesPerUser > 1;
  const hasReachedLimit = selectedCount >= item.pollMaxVotesPerUser;

  return (
    <>
      {manage ? (
        <form
          className={styles.pollSettings}
          onSubmit={(event) =>
            runMutation(event, updatePollSettings, "บันทึกโหมดโหวตแล้ว")
          }
        >
          <input name="roomId" type="hidden" value={roomId} />
          <input name="roomCode" type="hidden" value={roomCode} />
          <input name="boardItemId" type="hidden" value={item.id} />
          <select
            defaultValue={isMultipleVote ? "multiple" : "single"}
            name="pollVoteMode"
          >
            <option value="single">โหวตได้ข้อเดียว</option>
            <option value="multiple">โหวตได้หลายข้อ</option>
          </select>
          <Button pending={isPending} type="submit">
            บันทึกโหมด
          </Button>
        </form>
      ) : null}
      <p className={styles.pollHint}>
        {isMultipleVote
          ? "โหวตได้หลายข้อ และยกเลิกโหวตได้เสมอ"
          : "โหวตได้ข้อเดียว และยกเลิกโหวตได้เสมอ"}
      </p>
      <ul className={styles.poll}>
        {item.pollOptions.map((option) => {
          const cannotAddVote =
            isMultipleVote && !option.votedByCurrentUser && hasReachedLimit;
          const buttonText = option.votedByCurrentUser ? "ยกเลิกโหวต" : "โหวต";
          const percent = getPollOptionPercent(option.voteCount, totalVotes);

          return (
            <li
              className={styles.pollOption}
              data-selected={option.votedByCurrentUser ? "true" : undefined}
              key={option.id}
              style={{ "--poll-percent": `${percent}%` } as CSSProperties}
            >
              <button
                aria-busy={isPending ? "true" : undefined}
                className={styles.pollVoteButton}
                disabled={cannotAddVote}
                onClick={() => onVote(option.id)}
                type="button"
              >
                {buttonText}
              </button>
              <div className={styles.pollResult}>
                <div className={styles.pollResultTop}>
                  <span>{option.label}</span>
                  <strong>{percent}%</strong>
                </div>
                <div aria-hidden className={styles.pollBar}>
                  <span />
                </div>
                <span className={styles.voteCount}>
                  {option.voteCount} โหวต
                  {option.votedByCurrentUser ? " · คุณเลือกไว้" : ""}
                </span>
              </div>
              {manage ? (
                <details className={styles.inlineEdit}>
                  <summary>แก้ไข</summary>
                  <form
                    className={styles.inlineEditForm}
                    onSubmit={(event) =>
                      runMutation(event, updatePollOption, "แก้ไขตัวเลือกแล้ว")
                    }
                  >
                    <input name="roomId" type="hidden" value={roomId} />
                    <input name="roomCode" type="hidden" value={roomCode} />
                    <input name="optionId" type="hidden" value={option.id} />
                    <input
                      className={formStyles.control}
                      defaultValue={option.label}
                      maxLength={120}
                      name="label"
                      required
                    />
                    <Button pending={isPending} type="submit">
                      บันทึก
                    </Button>
                  </form>
                </details>
              ) : null}
              {manage ? (
                <Button
                  disabled={isPending || item.pollOptions.length <= 2}
                  onClick={() => onDelete(option.id, option.label)}
                  type="button"
                  variant="danger"
                >
                  ลบ
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {manage ? (
        <form
          className={styles.addInlineForm}
          onSubmit={(event) =>
            runMutation(event, createPollOption, "เพิ่มตัวเลือกแล้ว")
          }
        >
          <input name="roomId" type="hidden" value={roomId} />
          <input name="roomCode" type="hidden" value={roomCode} />
          <input name="boardItemId" type="hidden" value={item.id} />
          <input
            className={formStyles.control}
            maxLength={120}
            name="label"
            placeholder="เพิ่มตัวเลือกใหม่"
            required
          />
          <Button pending={isPending} type="submit">
            เพิ่มตัวเลือก
          </Button>
        </form>
      ) : null}
    </>
  );
}
