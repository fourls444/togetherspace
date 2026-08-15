"use client";

import { useState } from "react";

import { CreateInviteForm } from "@/components/rooms/create-invite-form";
import { Modal } from "@/components/ui/modal";
import styles from "./room-home.module.css";

type InviteModalTriggerProps = {
  roomCode: string;
  roomId: string;
};

/** ปุ่มเชิญสมาชิกจากหน้าแรก พร้อมเปิดฟอร์มสร้างคำเชิญใน modal */
export function InviteModalTrigger({ roomCode, roomId }: InviteModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className={styles.inviteButton} onClick={() => setIsOpen(true)} type="button">
        เชิญคนเข้ามา
      </button>
      <Modal
        description="กำหนดจำนวนครั้งที่ใช้ได้หรือวันหมดอายุของลิงก์ได้"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="md"
        title="สร้างคำเชิญชั่วคราว"
      >
        <CreateInviteForm roomCode={roomCode} roomId={roomId} />
      </Modal>
    </>
  );
}
