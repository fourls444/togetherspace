"use client";

import { useActionState, useEffect, useState } from "react";
import { BarChart3, ListChecks, StickyNote } from "lucide-react";

import {
  createChecklist,
  createNote,
  createPoll,
  type BoardActionState,
} from "@/features/boards/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import formStyles from "@/components/ui/form.module.css";
import { getBoardCopy, type BoardCopy } from "@/lib/boards/board-copy";
import type { BoardItemType, RoomType } from "@/lib/types/database";
import styles from "@/components/boards/board-create-forms.module.css";

const initialState: BoardActionState = {};

type BoardCreateFormsProps = {
  boardId: string;
  roomCode: string;
  roomId: string;
  roomType: RoomType;
};

type ActiveForm = BoardItemType | null;

type BoardDraft = {
  body: string;
  checklistItems?: string;
  pollOptions?: string;
  title: string;
  type: BoardItemType;
} | null;

/** แสดงปุ่มเพิ่มรายการ และเปิด modal ตามประเภทที่เลือก */
export function BoardCreateForms({
  boardId,
  roomCode,
  roomId,
  roomType,
}: BoardCreateFormsProps) {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [draft, setDraft] = useState<BoardDraft>(null);
  const [toast, setToast] = useState<string | null>(null);
  const copy = getBoardCopy(roomType);
  const [noteState, noteAction, isNotePending] = useActionState(
    createNote,
    initialState,
  );
  const [checklistState, checklistAction, isChecklistPending] = useActionState(
    createChecklist,
    initialState,
  );
  const [pollState, pollAction, isPollPending] = useActionState(
    createPoll,
    initialState,
  );

  useEffect(() => {
    if (noteState.success || checklistState.success || pollState.success) {
      const timer = window.setTimeout(() => {
        setActiveForm(null);
        setDraft(null);
        setToast("เพิ่มรายการลงบอร์ดแล้ว");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [noteState.success, checklistState.success, pollState.success]);

  return (
    <div>
      <div aria-label="เพิ่มรายการลงบอร์ด" className={styles.toolbar}>
        <button
          className={styles.smallButton}
          onClick={() => {
            setDraft(null);
            setActiveForm("note");
          }}
          type="button"
        >
          <StickyNote aria-hidden size={15} /> {copy.actions.note.label}
        </button>
        <button
          className={styles.smallButton}
          onClick={() => {
            setDraft(null);
            setActiveForm("checklist");
          }}
          type="button"
        >
          <ListChecks aria-hidden size={15} /> {copy.actions.checklist.label}
        </button>
        <button
          className={styles.smallButton}
          onClick={() => {
            setDraft(null);
            setActiveForm("poll");
          }}
          type="button"
        >
          <BarChart3 aria-hidden size={15} /> {copy.actions.poll.label}
        </button>
      </div>

      <div className={styles.presets} aria-label="ไอเดียเริ่มต้นของบอร์ด">
        {copy.starterSuggestions.map((suggestion) => (
          <button
            className={styles.presetButton}
            data-type={suggestion.type}
            key={suggestion.title}
            onClick={() => {
              setDraft({
                body: suggestion.body,
                checklistItems: suggestion.checklistItems,
                pollOptions: suggestion.pollOptions,
                title: suggestion.title,
                type: suggestion.type,
              });
              setActiveForm(suggestion.type);
            }}
            type="button"
          >
            <span>{copy.itemTypeLabels[suggestion.type]}</span>
            <strong>{suggestion.title}</strong>
          </button>
        ))}
      </div>

      <Modal
        description={
          activeForm
            ? copy.actions[activeForm].description
            : "เพิ่มเรื่องใหม่ลงบอร์ดของห้อง"
        }
        isOpen={Boolean(activeForm)}
        onClose={() => {
          setActiveForm(null);
          setDraft(null);
        }}
        size="md"
        title={activeForm ? copy.actions[activeForm].modalTitle : "เพิ่มรายการ"}
      >
        {activeForm === "note" ? (
          <NoteForm
            action={noteAction}
            boardId={boardId}
            copy={copy}
            draft={draft?.type === "note" ? draft : null}
            isPending={isNotePending}
            key={draft?.title ?? "note"}
            roomCode={roomCode}
            roomId={roomId}
            state={noteState}
          />
        ) : null}

        {activeForm === "checklist" ? (
          <ChecklistForm
            action={checklistAction}
            boardId={boardId}
            copy={copy}
            draft={draft?.type === "checklist" ? draft : null}
            isPending={isChecklistPending}
            key={draft?.title ?? "checklist"}
            roomCode={roomCode}
            roomId={roomId}
            state={checklistState}
          />
        ) : null}

        {activeForm === "poll" ? (
          <PollForm
            action={pollAction}
            boardId={boardId}
            copy={copy}
            draft={draft?.type === "poll" ? draft : null}
            isPending={isPollPending}
            key={draft?.title ?? "poll"}
            roomCode={roomCode}
            roomId={roomId}
            state={pollState}
          />
        ) : null}
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} tone="success" />
    </div>
  );
}

function NoteForm({
  action,
  boardId,
  copy,
  draft,
  isPending,
  roomCode,
  roomId,
  state,
}: {
  action: (payload: FormData) => void;
  boardId: string;
  copy: BoardCopy;
  draft: Exclude<BoardDraft, null> | null;
  isPending: boolean;
  roomCode: string;
  roomId: string;
  state: BoardActionState;
}) {
  return (
    <form action={action} className={styles.form}>
      <BoardHiddenFields
        boardId={boardId}
        roomCode={roomCode}
        roomId={roomId}
      />
      <BoardTitleField
        defaultValue={draft?.title}
        idPrefix="note"
        placeholder={copy.placeholders.title}
        state={state}
      />
      <BoardBodyField
        defaultValue={draft?.body}
        idPrefix="note"
        placeholder={copy.placeholders.body}
        state={state}
      />
      <BoardError state={state} />
      <Button
        pending={isPending}
        pendingText={copy.actions.note.pendingText}
        variant="primary"
      >
        {copy.actions.note.submitLabel}
      </Button>
    </form>
  );
}

function ChecklistForm({
  action,
  boardId,
  copy,
  draft,
  isPending,
  roomCode,
  roomId,
  state,
}: {
  action: (payload: FormData) => void;
  boardId: string;
  copy: BoardCopy;
  draft: Exclude<BoardDraft, null> | null;
  isPending: boolean;
  roomCode: string;
  roomId: string;
  state: BoardActionState;
}) {
  return (
    <form action={action} className={styles.form}>
      <BoardHiddenFields
        boardId={boardId}
        roomCode={roomCode}
        roomId={roomId}
      />
      <BoardTitleField
        defaultValue={draft?.title}
        idPrefix="checklist"
        placeholder={copy.placeholders.title}
        state={state}
      />
      <BoardBodyField
        defaultValue={draft?.body}
        idPrefix="checklist"
        placeholder={copy.placeholders.body}
        state={state}
      />
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="checklistItems">
          รายการในเช็คลิสต์
        </label>
        <textarea
          aria-describedby={
            state.fieldErrors?.checklistItems
              ? "checklist-items-errors"
              : "checklist-items-hint"
          }
          className={formStyles.control}
          defaultValue={draft?.checklistItems}
          id="checklistItems"
          name="checklistItems"
          placeholder={copy.placeholders.checklistItems}
          rows={4}
          required
        />
        <p className={styles.hint} id="checklist-items-hint">
          หนึ่งบรรทัดต่อหนึ่งรายการ และติ๊กกลับเพื่อยกเลิกได้
        </p>
        <FieldErrors
          id="checklist-items-errors"
          messages={state.fieldErrors?.checklistItems}
        />
      </div>
      <BoardError state={state} />
      <Button
        pending={isPending}
        pendingText={copy.actions.checklist.pendingText}
        variant="primary"
      >
        {copy.actions.checklist.submitLabel}
      </Button>
    </form>
  );
}

function PollForm({
  action,
  boardId,
  copy,
  draft,
  isPending,
  roomCode,
  roomId,
  state,
}: {
  action: (payload: FormData) => void;
  boardId: string;
  copy: BoardCopy;
  draft: Exclude<BoardDraft, null> | null;
  isPending: boolean;
  roomCode: string;
  roomId: string;
  state: BoardActionState;
}) {
  return (
    <form action={action} className={styles.form}>
      <BoardHiddenFields
        boardId={boardId}
        roomCode={roomCode}
        roomId={roomId}
      />
      <BoardTitleField
        defaultValue={draft?.title}
        idPrefix="poll"
        placeholder={copy.placeholders.title}
        state={state}
      />
      <BoardBodyField
        defaultValue={draft?.body}
        idPrefix="poll"
        placeholder={copy.placeholders.body}
        state={state}
      />
      <div className={formStyles.field}>
        <span className={formStyles.label}>ตัวเลือกสำหรับโหวต</span>
        <div
          aria-describedby={
            state.fieldErrors?.pollVoteMode
              ? "poll-vote-mode-errors"
              : "poll-vote-mode-hint"
          }
          className={styles.radioGroup}
        >
          <label className={styles.radioOption}>
            <input
              defaultChecked
              name="pollVoteMode"
              type="radio"
              value="single"
            />
            โหวตได้ข้อเดียว
          </label>
          <label className={styles.radioOption}>
            <input name="pollVoteMode" type="radio" value="multiple" />
            โหวตได้หลายข้อ (2 ข้อขึ้นไป)
          </label>
        </div>
        <p className={styles.hint} id="poll-vote-mode-hint">
          กดตัวเลือกที่โหวตไว้เพื่อยกเลิกได้เสมอ
        </p>
        <FieldErrors
          id="poll-vote-mode-errors"
          messages={state.fieldErrors?.pollVoteMode}
        />
      </div>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="pollOptions">
          ตัวเลือกโพล
        </label>
        <textarea
          aria-describedby={
            state.fieldErrors?.pollOptions
              ? "poll-options-errors"
              : "poll-options-hint"
          }
          className={formStyles.control}
          defaultValue={draft?.pollOptions}
          id="pollOptions"
          name="pollOptions"
          placeholder={copy.placeholders.pollOptions}
          rows={4}
          required
        />
        <p className={styles.hint} id="poll-options-hint">
          อย่างน้อย 2 ตัวเลือก หนึ่งบรรทัดต่อหนึ่งตัวเลือก
        </p>
        <FieldErrors
          id="poll-options-errors"
          messages={state.fieldErrors?.pollOptions}
        />
      </div>
      <BoardError state={state} />
      <Button
        pending={isPending}
        pendingText={copy.actions.poll.pendingText}
        variant="primary"
      >
        {copy.actions.poll.submitLabel}
      </Button>
    </form>
  );
}

function BoardHiddenFields({
  boardId,
  roomCode,
  roomId,
}: Pick<BoardCreateFormsProps, "boardId" | "roomCode" | "roomId">) {
  return (
    <>
      <input name="boardId" type="hidden" value={boardId} />
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="roomId" type="hidden" value={roomId} />
    </>
  );
}

function BoardTitleField({
  defaultValue,
  idPrefix,
  placeholder,
  state,
}: {
  defaultValue?: string;
  idPrefix: string;
  placeholder: string;
  state: BoardActionState;
}) {
  const inputId = `${idPrefix}-title`;
  const errorId = `${idPrefix}-title-errors`;

  return (
    <div className={formStyles.field}>
      <label className={formStyles.label} htmlFor={inputId}>
        หัวข้อ
      </label>
      <input
        aria-describedby={state.fieldErrors?.title ? errorId : undefined}
        className={formStyles.control}
        defaultValue={defaultValue}
        id={inputId}
        maxLength={120}
        name="title"
        placeholder={placeholder}
        required
      />
      <FieldErrors id={errorId} messages={state.fieldErrors?.title} />
    </div>
  );
}

function BoardBodyField({
  defaultValue,
  idPrefix,
  placeholder,
  state,
}: {
  defaultValue?: string;
  idPrefix: string;
  placeholder: string;
  state: BoardActionState;
}) {
  const inputId = `${idPrefix}-body`;
  const errorId = `${idPrefix}-body-errors`;

  return (
    <div className={formStyles.field}>
      <label className={formStyles.label} htmlFor={inputId}>
        รายละเอียด (ไม่บังคับ)
      </label>
      <textarea
        aria-describedby={state.fieldErrors?.body ? errorId : undefined}
        className={formStyles.control}
        defaultValue={defaultValue}
        id={inputId}
        maxLength={1000}
        name="body"
        placeholder={placeholder}
        rows={3}
      />
      <p className={styles.hint}>
        พิมพ์ขึ้นต้นด้วย - เพื่อทำ bullet หรือ 1. เพื่อทำรายการลำดับเลข
      </p>
      <FieldErrors id={errorId} messages={state.fieldErrors?.body} />
    </div>
  );
}

function BoardError({ state }: { state: BoardActionState }) {
  if (state.error) {
    return (
      <p className={formStyles.serviceError} role="alert">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className={styles.success} role="status">
        เพิ่มลงบอร์ดแล้ว
      </p>
    );
  }

  return null;
}
