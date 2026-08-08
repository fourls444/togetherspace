"use client";

import { useActionState } from "react";

import {
  createInvite,
  type CreateInviteState,
} from "@/features/invites/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: CreateInviteState = {};

type CreateInviteFormProps = {
  roomId: string;
};

export function CreateInviteForm({ roomId }: CreateInviteFormProps) {
  const [state, formAction, isPending] = useActionState(
    createInvite,
    initialState,
  );

  return (
    <form action={formAction} className={formStyles.form}>
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

      {state.success ? (
        <p style={{ color: "#10b981", margin: 0, fontSize: "0.875rem" }}>
          ✓ สร้างลิงก์คำเชิญเรียบร้อยแล้ว
        </p>
      ) : null}

      <Button pending={isPending} pendingText="กำลังสร้างลิงก์…" variant="primary">
        สร้างคำเชิญใหม่
      </Button>
    </form>
  );
}
