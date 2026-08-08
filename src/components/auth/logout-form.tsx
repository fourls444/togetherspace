"use client";

import { useActionState } from "react";

import { logout, type LogoutState } from "@/features/auth/actions";
import styles from "@/components/auth/logout-form.module.css";
import { Button } from "@/components/ui/button";

const initialState: LogoutState = {};

export function LogoutForm() {
  const [state, formAction, isPending] = useActionState(logout, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <Button pending={isPending} pendingText="กำลังออกจากระบบ…">
        ออกจากระบบ
      </Button>
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
