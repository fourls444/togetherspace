"use client";

import { useState, useTransition } from "react";

import { joinRoomByToken } from "@/features/invites/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getRoomPath } from "@/lib/rooms/room-path";
import type { RoomType } from "@/lib/types/database";
import styles from "@/components/rooms/invite-preview.module.css";

type InvitePreviewProps = {
  codeOrToken: string;
  room: {
    id: string;
    name: string;
    roomCode: string;
    type: RoomType;
    avatarUrl: string | null;
    memberCount: number;
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
        <div className={styles.avatar}>
          {room.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={room.avatarUrl} />
          ) : (
            <span>{room.name.trim().slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <p className={styles.eyebrow}>คำเชิญเข้าร่วมห้อง</p>
        <h1 className={styles.title}>{room.name}</h1>
        <div className={styles.badgeGroup}>
          <Badge>{room.type}</Badge>
          <Badge>{room.memberCount} สมาชิก</Badge>
        </div>
      </div>

      {errorMsg ? <p className={styles.error}>{errorMsg}</p> : null}

      {isAlreadyMember ? (
        <div className={styles.memberMessage}>
          <p>คุณเป็นสมาชิกของห้องนี้อยู่แล้ว</p>
          <a className={styles.roomLink} href={getRoomPath(room.roomCode)}>
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
