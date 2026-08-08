"use client";

import { useState, useTransition } from "react";

import { joinRoomByToken } from "@/features/invites/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { RoomType } from "@/lib/types/database";
import styles from "@/components/rooms/invite-preview.module.css";

type InvitePreviewProps = {
  codeOrToken: string;
  room: {
    id: string;
    name: string;
    type: RoomType;
    avatarUrl: string | null;
  };
  isAlreadyMember?: boolean;
};

export function InvitePreview({
  codeOrToken,
  room,
  isAlreadyMember = false,
}: InvitePreviewProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoin = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await joinRoomByToken(codeOrToken);
      if (res?.error) setErrorMsg(res.error);
    });
  };

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>คำเชิญเข้าร่วมห้อง</p>
        <h1 className={styles.title}>{room.name}</h1>
        <div className={styles.badgeGroup}>
          <Badge>{room.type}</Badge>
        </div>
      </div>

      {errorMsg ? <p className={styles.error}>{errorMsg}</p> : null}

      {isAlreadyMember ? (
        <div className={styles.memberMessage}>
          <p>คุณเป็นสมาชิกของห้องนี้อยู่แล้ว</p>
          <a className={styles.roomLink} href={`/rooms/${room.id}`}>
            ไปยังห้องของคุณ →
          </a>
        </div>
      ) : (
        <Button
          className={styles.joinBtn}
          disabled={isPending}
          onClick={handleJoin}
          pending={isPending}
          pendingText="กำลังเข้าร่วม…"
          variant="primary"
        >
          ยืนยันเข้าร่วมห้อง
        </Button>
      )}
    </Panel>
  );
}
