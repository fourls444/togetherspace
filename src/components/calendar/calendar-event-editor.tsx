"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/toast";
import {
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/features/calendar/actions";
import styles from "@/components/calendar/calendar.module.css";

export type EditableCalendarEvent = {
  id: string;
  title: string;
  date: string;
  description: string | null;
};

type CalendarEventEditorProps = {
  event: EditableCalendarEvent;
  roomCode: string;
  roomId: string;
};

/** ฟอร์มแก้ไขและลบกิจกรรม ใช้ซ้ำได้ทั้ง panel รายวันและหน้า list รายเดือน */
export function CalendarEventEditor({
  event,
  roomCode,
  roomId,
}: CalendarEventEditorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  /** บันทึกการแก้ไขกิจกรรมโดยไม่ต้องออกจากหน้าปัจจุบัน */
  function handleUpdate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    const formData = new FormData(submitEvent.currentTarget);
    startTransition(async () => {
      const result = await updateCalendarEvent(formData);
      setToast({
        message: result.error ?? "บันทึกกิจกรรมแล้ว",
        tone: result.error ? "error" : "success",
      });
      if (!result.error) setOpen(false);
    });
  }

  /** ลบกิจกรรมหลังผู้ใช้ยืนยัน */
  function handleDelete() {
    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("eventId", event.id);
    startTransition(async () => {
      const result = await deleteCalendarEvent(formData);
      setConfirmDelete(false);
      setToast({
        message: result.error ?? "ลบกิจกรรมแล้ว",
        tone: result.error ? "error" : "success",
      });
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button">
        แก้ไขกิจกรรม
      </Button>
      {open ? (
        <div className={styles.modalOverlay} role="presentation">
          <div
            aria-labelledby={`${event.id}-edit-title`}
            aria-modal="true"
            className={styles.modal}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelMeta}>แก้ไขกิจกรรม</p>
                <h2 className={styles.modalTitle} id={`${event.id}-edit-title`}>
                  {event.title}
                </h2>
              </div>
              <button
                aria-label="ปิดหน้าต่างแก้ไขกิจกรรม"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
      <form className={styles.eventEditForm} onSubmit={handleUpdate}>
        <input name="roomId" type="hidden" value={roomId} />
        <input name="roomCode" type="hidden" value={roomCode} />
        <input name="eventId" type="hidden" value={event.id} />
        <label htmlFor={`${event.id}-date`}>วันที่</label>
        <input
          defaultValue={event.date}
          id={`${event.id}-date`}
          name="eventDate"
          required
          type="date"
        />
        <label htmlFor={`${event.id}-title`}>ชื่อกิจกรรม</label>
        <input
          defaultValue={event.title}
          id={`${event.id}-title`}
          maxLength={120}
          name="title"
          required
        />
        <label htmlFor={`${event.id}-description`}>รายละเอียด</label>
        <textarea
          defaultValue={event.description ?? ""}
          id={`${event.id}-description`}
          maxLength={1000}
          name="description"
          rows={3}
        />
        <div className={styles.editActions}>
          <Button pending={isPending} type="submit" variant="primary">
            <Save aria-hidden size={16} /> บันทึกแก้ไข
          </Button>
          <Button
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
            type="button"
            variant="danger"
          >
            <Trash2 aria-hidden size={16} /> ลบกิจกรรม
          </Button>
        </div>
      </form>
      <ConfirmationDialog
        confirmLabel="ลบกิจกรรม"
        description={`“${event.title}” จะถูกลบจากปฏิทินและไม่สามารถกู้คืนได้`}
        isPending={isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        open={confirmDelete}
        title="ลบกิจกรรมนี้?"
        variant="danger"
      />
      <Toast
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        tone={toast?.tone}
      />
          </div>
        </div>
      ) : null}
    </>
  );
}
