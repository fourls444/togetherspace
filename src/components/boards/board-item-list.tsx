"use client";

import { useState, useTransition, type FormEvent } from "react";

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
  type BoardMutationState,
} from "@/features/boards/actions";
import { ArchiveBoardItemButton } from "@/components/boards/archive-board-item-button";
import {
  toggleChecklistState,
  togglePollVoteState,
} from "@/components/boards/board-interaction-state";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/toast";
import formStyles from "@/components/ui/form.module.css";
import type { BoardItemType } from "@/lib/types/database";
import styles from "@/components/boards/board-item-list.module.css";

export type BoardItemView = {
  id: string;
  itemType: BoardItemType;
  title: string;
  body: string | null;
  createdAt: string;
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
  items: BoardItemView[];
  roomCode: string;
  roomId: string;
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

const ITEM_TYPE_LABEL: Record<BoardItemType, string> = {
  note: "โน้ต",
  checklist: "รายการ",
  poll: "โพล",
};

/** แสดงรายการบนบอร์ด แยกตามโน้ต / รายการ / โพล */
export function BoardItemList({ items, roomCode, roomId }: BoardItemListProps) {
  const [isPending, startTransition] = useTransition();
  const [localItems, setLocalItems] = useState(items);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  if (!items.length) {
    return (
      <div className={styles.empty}>
        <h2>บอร์ดยังว่างอยู่</h2>
        <p>ลองเพิ่มโน้ต รายการ หรือโพลแรกของห้องนี้ได้เลย</p>
      </div>
    );
  }

  /** เรียก Server Action จากฟอร์มและแสดงผลลัพธ์ใน toast รูปแบบเดียวกัน */
  function runMutation(
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<BoardMutationState>,
    successMessage: string,
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

  return (
    <section aria-label="รายการบนบอร์ด" className={styles.grid}>
      {localItems.map((item) => (
        <article
          className={styles.card}
          data-type={item.itemType}
          key={item.id}
        >
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.type}>{ITEM_TYPE_LABEL[item.itemType]}</p>
              <h2 className={styles.title}>{item.title}</h2>
            </div>
            <ArchiveBoardItemButton
              boardItemId={item.id}
              roomCode={roomCode}
              roomId={roomId}
              title={item.title}
              onResult={(message, tone) => setToast({ message, tone })}
            />
          </div>

          {item.body ? <p className={styles.body}>{item.body}</p> : null}

          <details className={styles.editBox}>
            <summary>แก้ไขรายการ</summary>
            <form
              className={styles.editForm}
              onSubmit={(event) =>
                runMutation(event, updateBoardItem, "บันทึกรายการแล้ว")
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
              <Button pending={isPending} type="submit">
                บันทึก
              </Button>
            </form>
          </details>

          {item.itemType === "checklist" ? (
            <ChecklistItems
              boardItemId={item.id}
              items={item.checklistItems}
              isPending={isPending}
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
        </article>
      ))}
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

function ChecklistItems({
  boardItemId,
  items,
  isPending,
  onDelete,
  onToggle,
  roomCode,
  roomId,
  runMutation,
}: {
  boardItemId: string;
  items: BoardItemView["checklistItems"];
  isPending: boolean;
  onDelete: (id: string, label: string) => void;
  onToggle: (id: string) => void;
  roomCode: string;
  roomId: string;
  runMutation: (
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<BoardMutationState>,
    successMessage: string,
  ) => void;
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
        </li>
      ))}
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
    </ul>
  );
}

function PollOptions({
  item,
  isPending,
  onDelete,
  onVote,
  roomCode,
  roomId,
  runMutation,
}: {
  isPending: boolean;
  item: BoardItemView;
  onDelete: (id: string, label: string) => void;
  onVote: (id: string) => void;
  roomCode: string;
  roomId: string;
  runMutation: (
    event: FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<BoardMutationState>,
    successMessage: string,
  ) => void;
}) {
  const selectedCount = item.pollOptions.filter(
    (option) => option.votedByCurrentUser,
  ).length;
  const isMultipleVote = item.pollMaxVotesPerUser > 1;
  const hasReachedLimit = selectedCount >= item.pollMaxVotesPerUser;

  return (
    <>
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

          return (
            <li className={styles.pollOption} key={option.id}>
              <Button
                disabled={cannotAddVote || isPending}
                onClick={() => onVote(option.id)}
                type="button"
              >
                {buttonText}
              </Button>
              <span>{option.label}</span>
              <span className={styles.voteCount}>{option.voteCount} โหวต</span>
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
              <Button
                disabled={isPending || item.pollOptions.length <= 2}
                onClick={() => onDelete(option.id, option.label)}
                type="button"
                variant="danger"
              >
                ลบ
              </Button>
            </li>
          );
        })}
      </ul>
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
    </>
  );
}
