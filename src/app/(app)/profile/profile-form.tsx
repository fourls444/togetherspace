"use client";

import { useActionState } from "react";

import {
  updateProfile,
  type UpdateProfileState,
} from "@/features/profile/actions";
import { ImageUploadField } from "@/components/uploads/image-upload-field";
import { ActionSuccessToast } from "@/components/ui/action-success-toast";
import { SpecularCta } from "@/components/ui/specular-cta";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/app/(app)/profile/profile.module.css";

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
    <form action={formAction} className={styles.editorForm}>
      <div className={`${formStyles.field} ${styles.avatarColumn}`}>
        <ImageUploadField
          initialUrl={defaultValues.avatarUrl}
          kind="profile"
          label="เลือกรูป"
          layout="stacked"
        />
        <FieldErrors
          id="avatar-url-errors"
          messages={state.fieldErrors?.avatarUrl}
        />
      </div>

      <div className={styles.identityFields}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="displayName">
            ชื่อที่แสดง (Displayname)
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
            maxLength={40}
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
      </div>

      {state.error ? (
        <p
          className={`${formStyles.serviceError} ${styles.formMessage}`}
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <SpecularCta
          pending={isPending}
          pendingText="กำลังบันทึก…"
        >
          บันทึกโปรไฟล์
        </SpecularCta>
      </div>
      <ActionSuccessToast
        message="บันทึกโปรไฟล์แล้ว"
        signal={state}
        success={state.success}
      />
    </form>
  );
}
