"use client";

import { useState } from "react";

import { Toast } from "./toast";

/** แปลง success state ของ Server Action เป็นข้อความชั่วคราวที่แสดงซ้ำได้ทุกครั้งที่ state เปลี่ยน */
export function ActionSuccessToast({
  message,
  signal,
  success,
}: {
  message: string;
  signal: unknown;
  success: boolean | undefined;
}) {
  const [dismissedSignal, setDismissedSignal] = useState<unknown>(null);
  const visible = Boolean(success) && dismissedSignal !== signal;

  return (
    <Toast
      message={visible ? message : null}
      onDismiss={() => setDismissedSignal(signal)}
      tone="success"
    />
  );
}
