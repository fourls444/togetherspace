"use client";

import { Button } from "@/components/ui/button";
import {
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/features/calendar/actions";
import { CALENDAR_EVENT_COLORS } from "@/features/calendar/validation";
import styles from "@/components/calendar/calendar.module.css";

export type EditableCalendarEvent = {
  id: string;
  title: string;
  date: string;
  color: string;
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
  return (
    <details className={styles.editBox}>
      <summary>แก้ไขกิจกรรม</summary>
      <form action={updateCalendarEvent} className={styles.eventEditForm}>
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
        <fieldset className={styles.compactColorField}>
          <legend>สี</legend>
          <div className={styles.colorOptions}>
            {CALENDAR_EVENT_COLORS.map((color, index) => (
              <label className={styles.colorOption} key={color}>
                <input
                  aria-label={`สีที่ ${index + 1}`}
                  defaultChecked={event.color === color}
                  name="color"
                  type="radio"
                  value={color}
                />
                <span
                  aria-hidden
                  className={styles.colorSwatch}
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.editActions}>
          <Button type="submit">บันทึก</Button>
        </div>
      </form>
      <form
        action={deleteCalendarEvent}
        className={styles.deleteForm}
        onSubmit={(submitEvent) => {
          if (!window.confirm("ลบกิจกรรมนี้ใช่ไหม")) {
            submitEvent.preventDefault();
          }
        }}
      >
        <input name="roomId" type="hidden" value={roomId} />
        <input name="roomCode" type="hidden" value={roomCode} />
        <input name="eventId" type="hidden" value={event.id} />
        <Button type="submit" variant="danger">
          ลบกิจกรรม
        </Button>
      </form>
    </details>
  );
}
