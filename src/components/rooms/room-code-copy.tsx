"use client";

import { useState } from "react";

import styles from "@/components/rooms/room-code-copy.module.css";

type RoomCodeCopyProps = {
  className?: string;
  roomCode: string;
};

/** คัดลอกรหัสห้องเมื่อกดทั้งกรอบและแสดงสถานะสำเร็จชั่วคราว */
export function RoomCodeCopy({ className, roomCode }: RoomCodeCopyProps) {
  const [copied, setCopied] = useState(false);

  /** เขียนรหัสลง clipboard และคืนข้อความเดิมหลังช่วงสั้น ๆ */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      aria-label={`คัดลอกรหัสห้อง ${roomCode}`}
      className={[styles.button, className].filter(Boolean).join(" ")}
      onClick={handleCopy}
      type="button"
    >
      <span>รหัสห้อง</span>
      <span className={styles.valueRow}>
        <strong>{roomCode}</strong>
        <span aria-hidden className={styles.copyIcon} />
      </span>
      <small className={copied ? styles.copied : undefined}>
        {copied ? "คัดลอกแล้ว" : "กดเพื่อคัดลอก"}
      </small>
    </button>
  );
}
