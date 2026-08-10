"use client";

import { archiveBoardItem } from "@/features/boards/actions";
import { Button } from "@/components/ui/button";

type ArchiveBoardItemButtonProps = {
  boardItemId: string;
  roomCode: string;
  roomId: string;
  title: string;
};

/** ปุ่มเก็บรายการออกจากบอร์ด — ต้องยืนยันก่อน */
export function ArchiveBoardItemButton({
  boardItemId,
  roomCode,
  roomId,
  title,
}: ArchiveBoardItemButtonProps) {
  return (
    <form
      action={archiveBoardItem}
      onSubmit={(event) => {
        const ok = window.confirm(
          `เก็บ “${title}” ออกจากบอร์ด?\nรายการจะไม่โชว์บนบอร์ดอีก`,
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input name="roomId" type="hidden" value={roomId} />
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="boardItemId" type="hidden" value={boardItemId} />
      <Button type="submit" variant="danger">
        เก็บออก
      </Button>
    </form>
  );
}
