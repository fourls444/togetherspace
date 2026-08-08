"use client";

import { useActionState } from "react";

import { createRoom, type CreateRoomState } from "@/features/rooms/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import formStyles from "@/components/ui/form.module.css";

const initialState: CreateRoomState = {};

export function RoomForm() {
  const [state, formAction, isPending] = useActionState(
    createRoom,
    initialState,
  );

  return (
    <form action={formAction} className={formStyles.form}>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="name">
          ชื่อห้อง
        </label>
        <input
          aria-describedby={state.fieldErrors?.name ? "name-errors" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className={formStyles.control}
          id="name"
          maxLength={80}
          name="name"
          required
        />
        <FieldErrors id="name-errors" messages={state.fieldErrors?.name} />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="type">
          ประเภทห้อง
        </label>
        <select
          aria-describedby={state.fieldErrors?.type ? "type-errors" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.type)}
          className={formStyles.control}
          defaultValue="friend"
          id="type"
          name="type"
        >
          <option value="friend">Friend</option>
          <option value="couple">Couple</option>
          <option value="family">Family</option>
        </select>
        <FieldErrors id="type-errors" messages={state.fieldErrors?.type} />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="avatarUrl">
          URL รูปห้อง (ไม่บังคับ)
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.avatarUrl ? "avatar-url-errors" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.avatarUrl)}
          className={formStyles.control}
          id="avatarUrl"
          name="avatarUrl"
          placeholder="https://example.com/image.png"
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

      <Button
        className={formStyles.fullWidth}
        pending={isPending}
        pendingText="กำลังสร้าง…"
        variant="primary"
      >
        สร้างห้อง
      </Button>
    </form>
  );
}
