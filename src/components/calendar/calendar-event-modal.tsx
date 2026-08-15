"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import styles from "@/components/calendar/calendar.module.css";

const CalendarEventForm = dynamic(() =>
  import("@/components/calendar/calendar-event-form").then(
    (module) => module.CalendarEventForm,
  ),
);

type CalendarEventModalProps = {
  defaultDate: string;
  roomCode: string;
  roomId: string;
};

/** เปิดฟอร์มเพิ่มกิจกรรมใน modal เพื่อให้แผงรายละเอียดวันอ่านง่ายและไม่แน่นเกินไป */
export function CalendarEventModal({
  defaultDate,
  roomCode,
  roomId,
}: CalendarEventModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant="primary">
        เพิ่มกิจกรรม
      </Button>

      {open ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
        >
          <div
            aria-labelledby="calendar-event-modal-title"
            aria-modal="true"
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.panelMeta}>เพิ่มลงวันที่ {defaultDate}</p>
                <h2
                  className={styles.modalTitle}
                  id="calendar-event-modal-title"
                >
                  เพิ่มกิจกรรม
                </h2>
              </div>
              <button
                aria-label="ปิดหน้าต่างเพิ่มกิจกรรม"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <CalendarEventForm
              defaultDate={defaultDate}
              onSuccess={() => setOpen(false)}
              roomCode={roomCode}
              roomId={roomId}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
