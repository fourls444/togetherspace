"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { login, type LoginState } from "@/app/(auth)/login/actions";
import { PasswordField } from "@/components/ui/password-field";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: LoginState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "";

  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className={formStyles.form}>
      {nextParam ? <input name="next" type="hidden" value={nextParam} /> : null}

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="email">
          อีเมล
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.email ? "email-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className={formStyles.control}
          id="email"
          name="email"
          required
          type="email"
        />
        <FieldErrors id="email-errors" messages={state.fieldErrors?.email} />
      </div>

      <PasswordField
        autoComplete="current-password"
        errorId="password-errors"
        errorMessages={state.fieldErrors?.password}
        id="password"
        label="รหัสผ่าน"
        name="password"
        required
      />

      <div className={formStyles.formFooter}>
        <Link
          className={formStyles.textLink}
          href={
            nextParam
              ? `/forgot-password?next=${encodeURIComponent(nextParam)}`
              : "/forgot-password"
          }
        >
          ลืมรหัสผ่าน?
        </Link>
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
