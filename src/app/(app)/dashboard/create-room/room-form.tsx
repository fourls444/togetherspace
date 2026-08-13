"use client";

import { useActionState, useEffect } from "react";

import { createRoom, type CreateRoomState } from "@/features/rooms/actions";
import { ImageUploadField } from "@/components/uploads/image-upload-field";
import { SpecularCta } from "@/components/ui/specular-cta";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/app/(app)/dashboard/create-room/room-form.module.css";
import type { RoomType } from "@/lib/types/database";

const initialState: CreateRoomState = {};

const ROOM_TYPES = [
  {
    value: "friend",
    title: "กลุ่มเพื่อน",
    description: "คุยเล่น นัดเจอ เก็บโมเมนต์ด้วยกัน",
    namePlaceholder: "เช่น เพื่อนหลังเลิกงาน",
    imageHelper: "เหมาะกับรูปกลุ่ม รูปทริป หรือสัญลักษณ์ของเพื่อน",
  },
  {
    value: "couple",
    title: "คู่รัก",
    description: "พื้นที่สองคน สำหรับเรื่องของเรา",
    namePlaceholder: "เช่น บ้านเล็กของเรา",
    imageHelper: "เหมาะกับรูปคู่ รูปสถานที่โปรด หรือภาพที่แทนความทรงจำของสองคน",
  },
  {
    value: "family",
    title: "ครอบครัว",
    description: "บ้านนี้ สำหรับคนในครอบครัว",
    namePlaceholder: "เช่น บ้านมาชะเรือน",
    imageHelper: "เหมาะกับรูปครอบครัว บ้าน หรือสิ่งที่ทุกคนจำได้ร่วมกัน",
  },
] as const;

type RoomFormProps = {
  type: RoomType;
  onTypeChange: (type: RoomType) => void;
};

export function RoomForm({ type, onTypeChange }: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState,
  );
  const selectedType =
    ROOM_TYPES.find((option) => option.value === type) ?? ROOM_TYPES[0];

  useEffect(() => {
    document.documentElement.dataset.roomType = type;
    return () => {
      delete document.documentElement.dataset.roomType;
    };
  }, [type]);

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
          placeholder={selectedType.namePlaceholder}
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
                className={`${styles.typeCard} ${styles[`type_${option.value}`]} ${selected ? styles.typeCardSelected : ""}`}
                key={option.value}
                onClick={() => onTypeChange(option.value)}
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
        <span className={formStyles.label}>รูปห้อง</span>
        <ImageUploadField
          helperText={selectedType.imageHelper}
          initialUrl={null}
          kind="room"
          label="เลือกรูปห้อง"
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

      <SpecularCta
        className={formStyles.fullWidth}
        pending={isPending}
        pendingText="กำลังสร้าง…"
      >
        สร้างห้อง
      </SpecularCta>
    </form>
  );
}
