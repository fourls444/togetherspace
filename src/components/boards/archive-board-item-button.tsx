"use client";

import { useState, useTransition } from "react";

import { archiveBoardItem } from "@/features/boards/actions";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type ArchiveBoardItemButtonProps = {
  boardItemId: string;
  roomCode: string;
  roomId: string;
  title: string;
  onResult: (message: string, tone: "success" | "error") => void;
};

/** ปุ่มเก็บรายการออกจากบอร์ด — ต้องยืนยันก่อน */
export function ArchiveBoardItemButton({
  boardItemId,
  roomCode,
  roomId,
  title,
  onResult,
}: ArchiveBoardItemButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  /** เก็บรายการหลังผู้ใช้ยืนยันและส่งผลลัพธ์กลับไปแสดงบนหน้าบอร์ด */
  function handleArchive() {
    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("boardItemId", boardItemId);

    startTransition(async () => {
      const result = await archiveBoardItem(formData);
      if (result.error) {
        setOpen(false);
        onResult(result.error, "error");
        return;
      }

      setOpen(false);
      onResult("จัดเก็บรายการเรียบร้อยแล้ว", "success");
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant="primary">
        จัดเก็บ
      </Button>
      <ConfirmationDialog
        confirmLabel="จัดเก็บ"
        description={`“${title}” จะไม่แสดงบนบอร์ด แต่ข้อมูลยังไม่ถูกลบถาวร`}
        isPending={isPending}
        onCancel={() => setOpen(false)}
        onConfirm={handleArchive}
        open={open}
        title="จัดเก็บรายการนี้?"
        variant="primary"
      />
    </>
  );
}
