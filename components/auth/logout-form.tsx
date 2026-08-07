"use client";

import { useActionState } from "react";

import { logout, type LogoutState } from "@/app/actions/auth";
import styles from "@/components/auth/logout-form.module.css";
import { Button } from "@/components/ui/button";

const initialState: LogoutState = {};

/** ส่งคำขอ Logout พร้อมแสดงสถานะกำลังทำงานและ error ที่ลองใหม่ได้ */
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
