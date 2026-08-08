"use client";

import { useActionState } from "react";

import {
  joinRoomByCode,
  type JoinByCodeState,
} from "@/features/invites/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: JoinByCodeState = {};

export function JoinForm() {
  const [state, formAction, isPending] = useActionState(
    joinRoomByCode,
    initialState,
  );

  return (
    <form action={formAction} className={formStyles.form}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="inviteCode">
          รหัสห้อง (Room Code) หรือรหัสคำเชิญ
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.inviteCode ? "invite-code-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.inviteCode)}
          autoCapitalize="characters"
          className={formStyles.control}
          id="inviteCode"
          name="inviteCode"
          placeholder="รหัสห้อง 6 หลัก หรือรหัสคำเชิญ"
          required
        />
        <FieldErrors
          id="invite-code-errors"
          messages={state.fieldErrors?.inviteCode}
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
        pendingText="กำลังตรวจสอบ…"
        variant="primary"
      >
        เข้าร่วมห้อง
      </Button>
    </form>
  );
}
