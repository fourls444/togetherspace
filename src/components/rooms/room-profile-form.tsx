"use client";

import { useActionState } from "react";

import {
  updateRoomProfile,
  type UpdateRoomProfileState,
} from "@/features/room-profiles/actions";
import { ImageUploadField } from "@/components/uploads/image-upload-field";
import { Button } from "@/components/ui/button";
import { ActionSuccessToast } from "@/components/ui/action-success-toast";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/components/rooms/room-profile-form.module.css";

const initialState: UpdateRoomProfileState = {};

type RoomProfileFormProps = {
  defaultValues: {
    avatarUrl: string | null;
    displayName: string | null;
  };
  friendValues?: {
    bio: string | null;
    facebookUrl: string | null;
    lineId: string | null;
    instagramUrl: string | null;
    phone: string | null;
  };
  mainDisplayName: string;
  roomCode: string;
  roomId: string;
};

/** ฟอร์มตั้งชื่อและรูปเฉพาะห้อง ใช้ทับโปรไฟล์หลักเฉพาะในห้องนี้เท่านั้น */
export function RoomProfileForm({
  defaultValues,
  friendValues,
  mainDisplayName,
  roomCode,
  roomId,
}: RoomProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateRoomProfile,
    initialState,
  );

  return (
    <form action={formAction} className={styles.editorForm}>
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="roomId" type="hidden" value={roomId} />

      <div className={`${formStyles.field} ${styles.avatarColumn}`}>
        <ImageUploadField
          initialUrl={defaultValues.avatarUrl}
          kind="roomProfile"
          label="เลือกรูป"
          layout="stacked"
          roomId={roomId}
        />
        <FieldErrors
          id="room-profile-avatar-errors"
          messages={state.fieldErrors?.avatarUrl}
        />
      </div>

      <div className={`${formStyles.field} ${styles.identityField}`}>
        <label className={formStyles.label} htmlFor="roomDisplayName">
          ชื่อที่แสดง
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.displayName
              ? "room-display-name-errors"
              : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          className={formStyles.control}
          defaultValue={defaultValues.displayName ?? ""}
          id="roomDisplayName"
          maxLength={40}
          name="displayName"
          placeholder={`เว้นว่างไว้เพื่อใช้ ${mainDisplayName}`}
        />
        <FieldErrors
          id="room-display-name-errors"
          messages={state.fieldErrors?.displayName}
        />
        {friendValues ? (
          <div className={formStyles.field} style={{ marginTop: "1.25rem" }}>
            <label className={formStyles.label} htmlFor="friend-bio">
              แนะนำตัว
            </label>
            <textarea
              className={formStyles.control}
              defaultValue={friendValues.bio ?? ""}
              id="friend-bio"
              maxLength={500}
              name="bio"
              placeholder="เล่าเรื่องสั้นๆ เกี่ยวกับตัวเอง"
              rows={4}
            />
            <FieldErrors id="friend-bio-errors" messages={state.fieldErrors?.bio} />
          </div>
        ) : null}
      </div>

      {friendValues ? (
        <div className={`${styles.fullRow} ${styles.friendSection}`}>

          <div className={styles.contactsGrid}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="friend-facebook">Facebook</label>
              <input className={formStyles.control} defaultValue={friendValues.facebookUrl ?? ""} id="friend-facebook" name="facebookUrl" placeholder="https://facebook.com/..." type="url" />
              <FieldErrors id="friend-facebook-errors" messages={state.fieldErrors?.facebookUrl} />
            </div>
            
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="friend-line">Line ID</label>
              <input className={formStyles.control} defaultValue={friendValues.lineId ?? ""} id="friend-line" name="lineId" placeholder="เช่น together_01" />
              <FieldErrors id="friend-line-errors" messages={state.fieldErrors?.lineId} />
            </div>
            
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="friend-instagram">Instagram</label>
              <input className={formStyles.control} defaultValue={friendValues.instagramUrl ?? ""} id="friend-instagram" name="instagramUrl" placeholder="https://instagram.com/..." type="url" />
              <FieldErrors id="friend-instagram-errors" messages={state.fieldErrors?.instagramUrl} />
            </div>
            
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="friend-phone">Phone</label>
              <input className={formStyles.control} defaultValue={friendValues.phone ?? ""} id="friend-phone" name="phone" placeholder="08x-xxx-xxxx" type="tel" />
              <FieldErrors id="friend-phone-errors" messages={state.fieldErrors?.phone} />
            </div>
          </div>
        </div>
      ) : null}

      {state.error ? (
        <p
          className={`${formStyles.serviceError} ${styles.fullRow}`}
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        className={`${styles.submitButton} ${styles.fullRow}`}
        pending={isPending}
        pendingText="กำลังบันทึก…"
        variant="primary"
      >
        บันทึกโปรไฟล์ในห้องนี้
      </Button>
      <ActionSuccessToast
        message="บันทึกโปรไฟล์ในห้องนี้แล้ว"
        signal={state}
        success={state.success}
      />
    </form>
  );
}
