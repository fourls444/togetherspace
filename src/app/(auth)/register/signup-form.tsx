"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { signup, type SignupState } from "@/app/(auth)/register/actions";
import styles from "@/app/(auth)/register/signup.module.css";
import { PasswordField } from "@/components/ui/password-field";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: SignupState = {};

/** รับข้อมูลสมัครสมาชิกและผูก error จาก server กลับไปยังช่องที่มีปัญหา */
export function SignupForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "";
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <form
      action={formAction}
      className={`${formStyles.form} ${formStyles.formCompact}`}
    >
      {nextParam ? <input name="next" type="hidden" value={nextParam} /> : null}

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="username">
          ชื่อบัญชี
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.username ? "username-errors" : "username-hint"
          }
          aria-invalid={Boolean(state.fieldErrors?.username)}
          autoCapitalize="none"
          autoComplete="username"
          className={formStyles.control}
          id="username"
          maxLength={30}
          name="username"
          placeholder="เช่น space_01"
          required
        />
        <p className={styles.hint} id="username-hint">
          3–30 ตัว · อังกฤษ ตัวเลข _ · ใช้ในลิงก์/โปรไฟล์
        </p>
        <FieldErrors id="username-errors" messages={state.fieldErrors?.username} />
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

      <PasswordField
        autoComplete="new-password"
        errorId="password-errors"
        errorMessages={state.fieldErrors?.password}
        hint="อย่างน้อย 8 ตัว"
        hintId="password-hint"
        id="password"
        label="รหัสผ่าน"
        minLength={8}
        name="password"
        required
      />

      <PasswordField
        autoComplete="new-password"
        errorId="confirm-password-errors"
        errorMessages={state.fieldErrors?.confirmPassword}
        id="confirmPassword"
        label="ยืนยันรหัสผ่าน"
        minLength={8}
        name="confirmPassword"
        required
      />

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
