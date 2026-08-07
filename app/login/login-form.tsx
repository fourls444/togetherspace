"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: LoginState = {};

/** รับข้อมูลเข้าสู่ระบบและแสดง validation หรือ service error ในตำแหน่งที่เหมาะสม */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className={formStyles.form}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="email">
          อีเมล
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.email ? "email-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className={formStyles.control}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <FieldErrors id="email-errors" messages={state.fieldErrors?.email} />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="password">
          รหัสผ่าน
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.password ? "password-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.password)}
          className={formStyles.control}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldErrors
          id="password-errors"
          messages={state.fieldErrors?.password}
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
        pendingText="กำลังเข้าสู่ระบบ…"
        variant="primary"
      >
        เข้าสู่ระบบ
      </Button>
    </form>
  );
}
