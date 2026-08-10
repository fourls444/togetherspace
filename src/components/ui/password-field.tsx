"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

import formStyles from "@/components/ui/form.module.css";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  label: string;
  hint?: string;
  hintId?: string;
  errorId?: string;
  errorMessages?: string[];
};

/** ช่องรหัสผ่านพร้อมปุ่มโชว์/ซ่อนที่เข้าถึงได้ */
export function PasswordField({
  label,
  hint,
  hintId,
  errorId,
  errorMessages,
  id,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const hasErrors = Boolean(errorMessages?.length);

  const describedBy = [
    hint ? (hintId ?? `${inputId}-hint`) : null,
    hasErrors ? (errorId ?? `${inputId}-errors`) : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={formStyles.field}>
      <label className={formStyles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={formStyles.passwordRow}>
        <input
          {...props}
          aria-describedby={describedBy || undefined}
          aria-invalid={hasErrors || undefined}
          className={`${formStyles.control} ${formStyles.passwordControl}`}
          id={inputId}
          type={visible ? "text" : "password"}
        />
        <button
          aria-controls={inputId}
          aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          aria-pressed={visible}
          className={formStyles.passwordToggle}
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          {visible ? "ซ่อน" : "แสดง"}
        </button>
      </div>
      {hint ? (
        <p className={formStyles.hint} id={hintId ?? `${inputId}-hint`}>
          {hint}
        </p>
      ) : null}
      {hasErrors ? (
        <div className={formStyles.errors} id={errorId ?? `${inputId}-errors`}>
          {errorMessages!.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
