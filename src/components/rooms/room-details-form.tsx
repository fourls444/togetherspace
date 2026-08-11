"use client";

import { useActionState } from "react";

import { ImageUploadField } from "@/components/uploads/image-upload-field";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import {
  updateRoomDetails,
  type UpdateRoomDetailsState,
} from "@/features/rooms/actions";
import { ROOM_TYPE_LABEL } from "@/lib/rooms/labels";
import type { RoomType } from "@/lib/types/database";
import formStyles from "@/components/ui/form.module.css";

const initialState: UpdateRoomDetailsState = {};

type RoomDetailsFormProps = {
  avatarUrl: string | null;
  name: string;
  roomCode: string;
  roomId: string;
  roomType: RoomType;
};

/** แก้ชื่อและรูปห้อง โดยแสดงประเภทห้องเป็นข้อมูลอ่านอย่างเดียว */
export function RoomDetailsForm({
  avatarUrl,
  name,
  roomCode,
  roomId,
  roomType,
}: RoomDetailsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateRoomDetails,
    initialState,
  );

  return (
    <form action={formAction} className={formStyles.form}>
      <input name="roomId" type="hidden" value={roomId} />
      <input name="roomCode" type="hidden" value={roomCode} />

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="roomName">
          ชื่อห้อง
        </label>
        <input
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className={formStyles.control}
          defaultValue={name}
          id="roomName"
          maxLength={80}
          name="name"
          required
        />
        <FieldErrors id="room-name-errors" messages={state.fieldErrors?.name} />
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>ประเภทห้อง</span>
        <p className={formStyles.hint}>
          {ROOM_TYPE_LABEL[roomType]} ประเภทห้องกำหนดตอนสร้างและไม่สามารถเปลี่ยนได้
        </p>
      </div>

      <div className={formStyles.field}>
        <span className={formStyles.label}>รูปห้อง</span>
        <ImageUploadField
          helperText="รูปเดิมจะถูกลบจาก Storage หลังบันทึกรูปใหม่สำเร็จ"
          initialUrl={avatarUrl}
          kind="room"
          label="เลือกรูปห้อง"
          removeOldOnUpload={false}
          roomId={roomId}
        />
        <FieldErrors
          id="room-avatar-errors"
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
        pendingText="กำลังบันทึก…"
        variant="primary"
      >
        บันทึกข้อมูลห้อง
      </Button>
      {state.success ? (
        <p className={formStyles.serviceSuccess} role="status">
          บันทึกข้อมูลห้องแล้ว
        </p>
      ) : null}
    </form>
  );
}
