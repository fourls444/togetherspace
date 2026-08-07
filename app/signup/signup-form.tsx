"use client";

import { useActionState } from "react";

import { signup, type SignupState } from "@/app/signup/actions";
import styles from "@/app/signup/signup.module.css";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: SignupState = {};

/** รับข้อมูลสมัครสมาชิกและผูก error จาก server กลับไปยังช่องที่มีปัญหา */
export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className={formStyles.form}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="displayName">
          ชื่อที่แสดง
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.displayName ? "display-name-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          autoComplete="name"
          className={formStyles.control}
          id="displayName"
          maxLength={80}
          name="displayName"
          required
        />
        <FieldErrors
          id="display-name-errors"
          messages={state.fieldErrors?.displayName}
        />
      </div>

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

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="password">
          รหัสผ่าน
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.password
              ? "password-hint password-errors"
              : "password-hint"
          }
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="new-password"
          className={formStyles.control}
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
        <p className={styles.hint} id="password-hint">
          อย่างน้อย 8 ตัวอักษร
        </p>
        <FieldErrors
          id="password-errors"
          messages={state.fieldErrors?.password}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="confirmPassword">
          ยืนยันรหัสผ่าน
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.confirmPassword
              ? "confirm-password-errors"
              : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          autoComplete="new-password"
          className={formStyles.control}
          id="confirmPassword"
          minLength={8}
          name="confirmPassword"
          required
          type="password"
        />
        <FieldErrors
          id="confirm-password-errors"
          messages={state.fieldErrors?.confirmPassword}
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
        pendingText="กำลังสมัครสมาชิก…"
        variant="primary"
      >
        สมัครสมาชิก
      </Button>
    </form>
  );
}
