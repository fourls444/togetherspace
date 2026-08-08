"use client";

import { useActionState } from "react";

import {
  updateProfile,
  type UpdateProfileState,
} from "@/features/profile/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/app/profile/profile.module.css";

const initialState: UpdateProfileState = {};

type ProfileFormProps = {
  defaultValues: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
};

/** ฟอร์มแก้ไขโปรไฟล์: ชื่อที่แสดง, ชื่อผู้ใช้, รูปโปรไฟล์ */
export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

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
          defaultValue={defaultValues.displayName}
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
        <label className={formStyles.label} htmlFor="username">
          ชื่อผู้ใช้ (Username)
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.username ? "username-errors" : "username-hint"
          }
          aria-invalid={Boolean(state.fieldErrors?.username)}
          autoCapitalize="none"
          autoComplete="username"
          className={formStyles.control}
          defaultValue={defaultValues.username}
          id="username"
          maxLength={30}
          name="username"
          required
        />
        <p className={styles.hint} id="username-hint">
          3-30 ตัวอักษร ใช้ได้เฉพาะ a-z, 0-9 และ _ (ตัวพิมพ์เล็กทั้งหมด)
        </p>
        <FieldErrors
          id="username-errors"
          messages={state.fieldErrors?.username}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="avatarUrl">
          URL รูปโปรไฟล์ (ไม่บังคับ)
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.avatarUrl ? "avatar-url-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.avatarUrl)}
          className={formStyles.control}
          defaultValue={defaultValues.avatarUrl ?? ""}
          id="avatarUrl"
          name="avatarUrl"
          placeholder="https://example.com/photo.png"
          type="url"
        />
        <FieldErrors
          id="avatar-url-errors"
          messages={state.fieldErrors?.avatarUrl}
        />
      </div>

      {state.error ? (
        <p className={formStyles.serviceError} role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className={styles.success} role="status">
          บันทึกโปรไฟล์เรียบร้อยแล้ว
        </p>
      ) : null}

      <Button
        className={formStyles.fullWidth}
        pending={isPending}
        pendingText="กำลังบันทึก…"
        variant="primary"
      >
        บันทึกโปรไฟล์
      </Button>
    </form>
  );
}
