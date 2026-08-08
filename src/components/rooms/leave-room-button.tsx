"use client";

import { useState, useTransition } from "react";

import { leaveRoom } from "@/features/members/actions";
import { Button } from "@/components/ui/button";

type LeaveRoomButtonProps = {
  roomId: string;
};

export function LeaveRoomButton({ roomId }: LeaveRoomButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLeave = () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการออกจากห้องนี้?")) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await leaveRoom(roomId);
      if (res?.error) setErrorMsg(res.error);
    });
  };

  return (
    <div>
      {errorMsg ? (
        <p
          style={{
            color: "var(--color-error-text)",
            background: "var(--color-error-surface)",
            border: "1px solid var(--color-error-border)",
            padding: "0.75rem",
            borderRadius: "var(--radius-control)",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          {errorMsg}
        </p>
      ) : null}
      <Button
        disabled={isPending}
        onClick={handleLeave}
        pending={isPending}
        pendingText="กำลังออกจากห้อง…"
        type="button"
        variant="danger"
      >
        ออกจากห้อง
      </Button>
    </div>
  );
}
