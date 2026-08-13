"use client";

import { useActionState } from "react";

import {
  createInvite,
  type CreateInviteState,
} from "@/features/invites/actions";
import { ActionSuccessToast } from "@/components/ui/action-success-toast";
import { SpecularCta } from "@/components/ui/specular-cta";
import { FieldErrors } from "@/components/ui/field-errors";
import styles from "@/components/rooms/create-invite-form.module.css";
import formStyles from "@/components/ui/form.module.css";

const initialState: CreateInviteState = {};

type CreateInviteFormProps = {
  roomCode: string;
  roomId: string;
};

export function CreateInviteForm({ roomCode, roomId }: CreateInviteFormProps) {
  const [state, formAction, isPending] = useActionState(
    createInvite,
    initialState,
  );

  return (
    <form action={formAction} className={`${formStyles.form} ${styles.form}`}>
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="roomId" type="hidden" value={roomId} />

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="maxUses">
          จำนวนครั้งที่ใช้งานได้สูงสุด (ไม่ระบุ = ไม่จำกัด)
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.maxUses ? "max-uses-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.maxUses)}
          className={formStyles.control}
          id="maxUses"
          min={1}
          name="maxUses"
          placeholder="เช่น 10"
          type="number"
        />
        <FieldErrors
          id="max-uses-errors"
          messages={state.fieldErrors?.maxUses}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="expiresAt">
          วันหมดอายุ (ไม่ระบุ = ไม่มีวันหมดอายุ)
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.expiresAt ? "expires-at-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.expiresAt)}
          className={formStyles.control}
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
        />
        <FieldErrors
          id="expires-at-errors"
          messages={state.fieldErrors?.expiresAt}
        />
      </div>

      {state.error ? (
        <p className={formStyles.serviceError} role="alert">
          {state.error}
        </p>
      ) : null}

      <div className={styles.submit}>
        <SpecularCta pending={isPending} pendingText="กำลังสร้างลิงก์…">
          สร้างคำเชิญใหม่
        </SpecularCta>
      </div>
      <ActionSuccessToast
        message="สร้างลิงก์คำเชิญแล้ว"
        signal={state}
        success={state.success}
      />
    </form>
  );
}
