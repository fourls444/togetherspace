"use client";

import { useActionState } from "react";

import {
  createCalendarEvent,
  type CalendarActionState,
} from "@/features/calendar/actions";
import { CALENDAR_EVENT_COLORS } from "@/features/calendar/validation";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/components/calendar/calendar.module.css";

const initialState: CalendarActionState = {};

type CalendarEventFormProps = {
  defaultDate: string;
  roomCode: string;
  roomId: string;
};

/** ฟอร์มเพิ่มกิจกรรมลงวันที่ที่เลือก พร้อมสี marker บนปฏิทิน */
export function CalendarEventForm({
  defaultDate,
  roomCode,
  roomId,
}: CalendarEventFormProps) {
  const [state, formAction, isPending] = useActionState(
    createCalendarEvent,
    initialState,
  );

  return (
    <form action={formAction} className={formStyles.form}>
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="roomId" type="hidden" value={roomId} />

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="eventDate">
          วันที่
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.eventDate ? "event-date-errors" : undefined
          }
          className={formStyles.control}
          defaultValue={defaultDate}
          id="eventDate"
          name="eventDate"
          required
          type="date"
        />
        <FieldErrors
          id="event-date-errors"
          messages={state.fieldErrors?.eventDate}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="eventTitle">
          ชื่อกิจกรรม
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.title ? "event-title-errors" : undefined
          }
          className={formStyles.control}
          id="eventTitle"
          maxLength={120}
          name="title"
          placeholder="เช่น นัดกินข้าวเย็น"
          required
        />
        <FieldErrors
          id="event-title-errors"
          messages={state.fieldErrors?.title}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="eventDescription">
          รายละเอียด (ไม่บังคับ)
        </label>
        <textarea
          aria-describedby={
            state.fieldErrors?.description
              ? "event-description-errors"
              : undefined
          }
          className={formStyles.control}
          id="eventDescription"
          maxLength={1000}
          name="description"
          rows={3}
        />
        <FieldErrors
          id="event-description-errors"
          messages={state.fieldErrors?.description}
        />
      </div>

      <fieldset className={styles.colorField}>
        <legend className={formStyles.label}>สีบนปฏิทิน</legend>
        <div className={styles.colorOptions}>
          {CALENDAR_EVENT_COLORS.map((color, index) => (
            <label className={styles.colorOption} key={color}>
              <input
                aria-label={`สีที่ ${index + 1}`}
                defaultChecked={index === 0}
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
        <FieldErrors
          id="event-color-errors"
          messages={state.fieldErrors?.color}
        />
      </fieldset>

      {state.error ? (
        <p className={formStyles.serviceError} role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className={formStyles.serviceSuccess} role="status">
          เพิ่มกิจกรรมแล้ว
        </p>
      ) : null}

      <Button
        className={formStyles.fullWidth}
        pending={isPending}
        pendingText="กำลังเพิ่ม…"
        variant="primary"
      >
        เพิ่มกิจกรรม
      </Button>
    </form>
  );
}
