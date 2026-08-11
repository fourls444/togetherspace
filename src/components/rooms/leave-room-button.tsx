"use client";

import { useState, useTransition } from "react";

import { leaveRoom } from "@/features/members/actions";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/toast";

type LeaveRoomButtonProps = {
  roomId: string;
};

export function LeaveRoomButton({ roomId }: LeaveRoomButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /** ออกจากห้องหลังยืนยันและแสดงข้อผิดพลาดหากระบบไม่อนุญาต */
  const handleLeave = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await leaveRoom(roomId);
      if (res?.error) {
        setOpen(false);
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div>
      <Button
        onClick={() => setOpen(true)}
        type="button"
        variant="danger"
      >
        ออกจากห้อง
      </Button>
      <ConfirmationDialog
        confirmLabel="ออกจากห้อง"
        description="คุณจะเข้าถึงข้อมูลในห้องนี้ไม่ได้จนกว่าจะเข้าร่วมอีกครั้งด้วยรหัสหรือคำเชิญ"
        isPending={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={handleLeave}
        open={open}
        title="ออกจากห้องนี้?"
        variant="danger"
      />
      <Toast
        message={errorMsg}
        onDismiss={() => setErrorMsg(null)}
        tone="error"
      />
    </div>
  );
}
