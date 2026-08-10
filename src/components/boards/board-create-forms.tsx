"use client";

import { useActionState, useState } from "react";

import {
  createChecklist,
  createNote,
  createPoll,
  type BoardActionState,
} from "@/features/boards/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/components/boards/board-create-forms.module.css";

const initialState: BoardActionState = {};

type BoardCreateFormsProps = {
  boardId: string;
  roomCode: string;
  roomId: string;
};

type ActiveForm = "note" | "checklist" | "poll" | null;

/** แสดงปุ่มเพิ่ม item แบบเล็ก และเปิด modal เฉพาะประเภทที่ผู้ใช้เลือก */
export function BoardCreateForms({
  boardId,
  roomCode,
  roomId,
}: BoardCreateFormsProps) {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
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

  return (
    <div>
      <div aria-label="เพิ่มรายการลงบอร์ด" className={styles.toolbar}>
        <button
          className={styles.smallButton}
          onClick={() => setActiveForm("note")}
          type="button"
        >
          + Note
        </button>
        <button
          className={styles.smallButton}
          onClick={() => setActiveForm("checklist")}
          type="button"
        >
          + Checklist
        </button>
        <button
          className={styles.smallButton}
          onClick={() => setActiveForm("poll")}
          type="button"
        >
          + Poll
        </button>
      </div>

      {activeForm ? (
        <div className={styles.overlay}>
          <div
            aria-modal="true"
            className={styles.modal}
            role="dialog"
            aria-labelledby="board-create-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.title} id="board-create-modal-title">
                {getModalTitle(activeForm)}
              </h2>
              <button
                aria-label="ปิดหน้าต่างเพิ่มรายการ"
                className={styles.closeButton}
                onClick={() => setActiveForm(null)}
                type="button"
              >
                ×
              </button>
            </div>

            {activeForm === "note" ? (
              <NoteForm
                action={noteAction}
                boardId={boardId}
                isPending={isNotePending}
                roomCode={roomCode}
                roomId={roomId}
                state={noteState}
              />
            ) : null}

            {activeForm === "checklist" ? (
              <ChecklistForm
                action={checklistAction}
                boardId={boardId}
                isPending={isChecklistPending}
                roomCode={roomCode}
                roomId={roomId}
                state={checklistState}
              />
            ) : null}

            {activeForm === "poll" ? (
              <PollForm
                action={pollAction}
                boardId={boardId}
                isPending={isPollPending}
                roomCode={roomCode}
                roomId={roomId}
                state={pollState}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** คืนชื่อหัว modal ตามประเภท item ที่กำลังสร้าง */
function getModalTitle(activeForm: Exclude<ActiveForm, null>) {
  if (activeForm === "note") return "เพิ่ม Note";
  if (activeForm === "checklist") return "เพิ่ม Checklist";
  return "เพิ่ม Poll";
}

/** ฟอร์มสร้าง note สำหรับข้อความธรรมดา */
function NoteForm({
  action,
  boardId,
  isPending,
  roomCode,
  roomId,
  state,
}: {
  action: (payload: FormData) => void;
  boardId: string;
  isPending: boolean;
  roomCode: string;
  roomId: string;
  state: BoardActionState;
}) {
  return (
    <form action={action} className={styles.form}>
      <BoardHiddenFields boardId={boardId} roomCode={roomCode} roomId={roomId} />
      <BoardTitleField idPrefix="note" state={state} />
      <BoardBodyField idPrefix="note" state={state} />
      <BoardError state={state} />
      <Button pending={isPending} pendingText="กำลังเพิ่ม note…" variant="primary">
        เพิ่ม note
      </Button>
    </form>
  );
}

/** ฟอร์มสร้าง checklist โดยแยกรายการจาก textarea หนึ่งบรรทัดต่อหนึ่งรายการ */
function ChecklistForm({
  action,
  boardId,
  isPending,
  roomCode,
  roomId,
  state,
}: {
  action: (payload: FormData) => void;
  boardId: string;
  isPending: boolean;
  roomCode: string;
  roomId: string;
  state: BoardActionState;
}) {
  return (
    <form action={action} className={styles.form}>
      <BoardHiddenFields boardId={boardId} roomCode={roomCode} roomId={roomId} />
      <BoardTitleField idPrefix="checklist" state={state} />
      <BoardBodyField idPrefix="checklist" state={state} />
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="checklistItems">
          รายการ checklist
        </label>
        <textarea
          aria-describedby={
            state.fieldErrors?.checklistItems
              ? "checklist-items-errors"
              : "checklist-items-hint"
          }
          className={formStyles.control}
          id="checklistItems"
          name="checklistItems"
          placeholder={"ซื้อของ\nจองร้าน\nเตรียมเอกสาร"}
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
        pendingText="กำลังเพิ่ม checklist…"
        variant="primary"
      >
        เพิ่ม checklist
      </Button>
    </form>
  );
}

/** ฟอร์มสร้าง poll พร้อมเลือกโหมดจำนวนโหวตต่อคนแบบสั้นและยกเลิกโหวตได้เสมอ */
function PollForm({
  action,
  boardId,
  isPending,
  roomCode,
  roomId,
  state,
}: {
  action: (payload: FormData) => void;
  boardId: string;
  isPending: boolean;
  roomCode: string;
  roomId: string;
  state: BoardActionState;
}) {
  return (
    <form action={action} className={styles.form}>
      <BoardHiddenFields boardId={boardId} roomCode={roomCode} roomId={roomId} />
      <BoardTitleField idPrefix="poll" state={state} />
      <BoardBodyField idPrefix="poll" state={state} />
      <div className={formStyles.field}>
        <span className={formStyles.label}>จำนวนโหวตต่อคน</span>
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
          ผู้ใช้สามารถกดตัวเลือกที่โหวตไว้เพื่อยกเลิกได้เสมอ
        </p>
        <FieldErrors
          id="poll-vote-mode-errors"
          messages={state.fieldErrors?.pollVoteMode}
        />
      </div>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="pollOptions">
          ตัวเลือก poll
        </label>
        <textarea
          aria-describedby={
            state.fieldErrors?.pollOptions
              ? "poll-options-errors"
              : "poll-options-hint"
          }
          className={formStyles.control}
          id="pollOptions"
          name="pollOptions"
          placeholder={"เสาร์นี้\nอาทิตย์นี้\nสัปดาห์หน้า"}
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
      <Button pending={isPending} pendingText="กำลังเพิ่ม poll…" variant="primary">
        เพิ่ม poll
      </Button>
    </form>
  );
}

/** เก็บค่า room/board ที่ทุกฟอร์มต้องส่งกลับไปยัง Server Action */
function BoardHiddenFields({
  boardId,
  roomCode,
  roomId,
}: BoardCreateFormsProps) {
  return (
    <>
      <input name="boardId" type="hidden" value={boardId} />
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="roomId" type="hidden" value={roomId} />
    </>
  );
}

/** ช่องหัวข้อที่ใช้ร่วมกันระหว่าง note, checklist และ poll */
function BoardTitleField({
  idPrefix,
  state,
}: {
  idPrefix: string;
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
        id={inputId}
        maxLength={120}
        name="title"
        required
      />
      <FieldErrors id={errorId} messages={state.fieldErrors?.title} />
    </div>
  );
}

/** ช่องรายละเอียดเสริมที่ใช้ร่วมกันระหว่าง board item ทุกประเภท */
function BoardBodyField({
  idPrefix,
  state,
}: {
  idPrefix: string;
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
        id={inputId}
        maxLength={1000}
        name="body"
        rows={3}
      />
      <FieldErrors id={errorId} messages={state.fieldErrors?.body} />
    </div>
  );
}

/** แสดง error จาก service หรือสถานะสำเร็จหลังส่งฟอร์ม */
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
