"use client";

import { useActionState } from "react";

import {
  updateRoomProfile,
  type UpdateRoomProfileState,
} from "@/features/room-profiles/actions";
import { ImageUploadField } from "@/components/uploads/image-upload-field";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: UpdateRoomProfileState = {};

type RoomProfileFormProps = {
  defaultValues: {
    avatarUrl: string | null;
    displayName: string | null;
  };
  mainDisplayName: string;
  roomCode: string;
  roomId: string;
};

/** ฟอร์มตั้งชื่อและรูปเฉพาะห้อง ใช้ทับโปรไฟล์หลักเฉพาะในห้องนี้เท่านั้น */
export function RoomProfileForm({
  defaultValues,
  mainDisplayName,
  roomCode,
  roomId,
}: RoomProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateRoomProfile,
    initialState,
  );

  return (
    <form action={formAction} className={formStyles.form}>
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="roomId" type="hidden" value={roomId} />

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="roomDisplayName">
          ชื่อที่ใช้ในห้องนี้
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.displayName
              ? "room-display-name-errors"
              : "room-display-name-hint"
          }
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          className={formStyles.control}
          defaultValue={defaultValues.displayName ?? ""}
          id="roomDisplayName"
          maxLength={80}
          name="displayName"
          placeholder={`เว้นว่างไว้เพื่อใช้ ${mainDisplayName}`}
        />
        <p className={formStyles.hint} id="room-display-name-hint">
          ใช้สำหรับแสดงในรายชื่อสมาชิกของห้องนี้เท่านั้น
        </p>
        <FieldErrors
          id="room-display-name-errors"
          messages={state.fieldErrors?.displayName}
        />
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>รูปที่ใช้ในห้องนี้</span>
        <ImageUploadField
          helperText="ถ้าไม่เลือกรูป ระบบจะใช้รูปจากโปรไฟล์หลัก"
          initialUrl={defaultValues.avatarUrl}
          kind="roomProfile"
          label="เลือกรูปในห้องนี้"
          roomId={roomId}
        />
        <FieldErrors
          id="room-profile-avatar-errors"
          messages={state.fieldErrors?.avatarUrl}
        />
      </div>

      {state.error ? (
        <p className={formStyles.serviceError} role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className={formStyles.serviceSuccess} role="status">
          บันทึกโปรไฟล์ในห้องนี้แล้ว
        </p>
      ) : null}

      <Button
        className={formStyles.fullWidth}
        pending={isPending}
        pendingText="กำลังบันทึก…"
        variant="primary"
      >
        บันทึกโปรไฟล์ในห้องนี้
      </Button>
    </form>
  );
}
