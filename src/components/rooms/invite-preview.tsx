"use client";

import { useState, useTransition } from "react";

import { joinRoomByToken } from "@/features/invites/actions";
import { Badge } from "@/components/ui/badge";
import { SpecularCta } from "@/components/ui/specular-cta";
import { Panel } from "@/components/ui/panel";
import { ROOM_TYPE_LABEL } from "@/lib/rooms/labels";
import { getRoomPath } from "@/lib/rooms/room-path";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
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
  const avatar = room.avatarUrl?.trim() || getDefaultImageUrl("room");

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={avatar} />
        </div>
        <h1 className={styles.title}>{room.name}</h1>
        <p className={styles.inviteHint}>คำเชิญเข้าร่วมห้อง</p>
        <div className={styles.badgeGroup}>
          <Badge>{ROOM_TYPE_LABEL[room.type]}</Badge>
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
        <SpecularCta
          className={styles.joinBtn}
          disabled={isPending}
          onClick={handleJoin}
          pending={isPending}
          pendingText="กำลังเข้าร่วม…"
          type="button"
        >
          ยืนยันเข้าร่วมห้อง
        </SpecularCta>
      )}
    </Panel>
  );
}
