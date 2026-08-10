"use client";

import { useActionState, useState } from "react";

import { createRoom, type CreateRoomState } from "@/features/rooms/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/app/(app)/dashboard/create-room/room-form.module.css";

const initialState: CreateRoomState = {};

const ROOM_TYPES = [
  {
    value: "friend",
    title: "กลุ่มเพื่อน",
    description: "คุยเล่น นัดเจอ เก็บโมเมนต์ด้วยกัน",
  },
  {
    value: "couple",
    title: "คู่รัก",
    description: "พื้นที่สองคน สำหรับเรื่องของเรา",
  },
  {
    value: "family",
    title: "ครอบครัว",
    description: "บ้านนี้ สำหรับคนในครอบครัว",
  },
] as const;

export function RoomForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState,
  );
  const [type, setType] = useState<(typeof ROOM_TYPES)[number]["value"]>(
    "friend",
  );

  return (
    <form action={formAction} className={formStyles.form}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="name">
          ชื่อห้อง
        </label>
        <input
          aria-describedby={state.fieldErrors?.name ? "name-errors" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className={formStyles.control}
          id="name"
          maxLength={80}
          name="name"
          placeholder="เช่น ห้องหลังเลิกงาน"
          required
        />
        <FieldErrors id="name-errors" messages={state.fieldErrors?.name} />
      </div>

      <fieldset className={styles.typeField}>
        <legend className={formStyles.label}>ห้องนี้สำหรับใคร</legend>
        <input name="type" type="hidden" value={type} />
        <div className={styles.typeGrid}>
          {ROOM_TYPES.map((option) => {
            const selected = type === option.value;
            return (
              <button
                aria-pressed={selected}
                className={`${styles.typeCard} ${selected ? styles.typeCardSelected : ""}`}
                key={option.value}
                onClick={() => setType(option.value)}
                type="button"
              >
                <span className={styles.typeTitle}>{option.title}</span>
                <span className={styles.typeText}>{option.description}</span>
              </button>
            );
          })}
        </div>
        <FieldErrors id="type-errors" messages={state.fieldErrors?.type} />
      </fieldset>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="avatarUrl">
          ลิงก์รูปห้อง (ไม่บังคับ)
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.avatarUrl ? "avatar-url-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.avatarUrl)}
          className={formStyles.control}
          id="avatarUrl"
          name="avatarUrl"
          placeholder="วางลิงก์รูปถ้ามี"
          type="url"
        />
        <FieldErrors
          id="avatar-url-errors"
          messages={state.fieldErrors?.avatarUrl}
        />
      </div>

      {state.error ? (
        <p className={formStyles.serviceError} role="alert">
          {state.error}
        </p>
      ) : null}

      <Button
        className={formStyles.fullWidth}
        pending={isPending}
        pendingText="กำลังสร้าง…"
        variant="primary"
      >
        สร้างห้อง
      </Button>
    </form>
  );
}
