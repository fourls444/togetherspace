"use client";

import { useState, useTransition } from "react";

import { revokeInvite } from "@/features/invites/actions";
import { Button } from "@/components/ui/button";
import styles from "@/components/rooms/invite-list.module.css";

export type InviteListItem = {
  id: string;
  inviteCode: string;
  inviteToken: string;
  usesCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

type InviteListProps = {
  invites: InviteListItem[];
  roomCode: string;
  roomId: string;
};

export function InviteList({ invites, roomCode, roomId }: InviteListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopyLink = (token: string, id: string) => {
    const origin = window.location.origin;
    const url = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (inviteId: string) => {
    if (!confirm("คุณต้องการยกเลิกคำเชิญนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      await revokeInvite(inviteId, roomId, roomCode);
    });
  };

  if (!invites.length) {
    return <p className={styles.empty}>ยังไม่มีรายการคำเชิญที่สร้างไว้</p>;
  }

  return (
    <ul className={styles.list}>
      {invites.map((invite) => {
        const isRevoked = Boolean(invite.revokedAt);
        const isExpired = invite.expiresAt
          ? new Date(invite.expiresAt) <= new Date()
          : false;
        const isMaxed =
          invite.maxUses !== null && invite.usesCount >= invite.maxUses;
        const isInactive = isRevoked || isExpired || isMaxed;

        return (
          <li
            className={`${styles.item} ${isInactive ? styles.inactive : ""}`}
            key={invite.id}
          >
            <div className={styles.details}>
              <p className={styles.code}>
                โค้ด: <code>{invite.inviteCode}</code>
              </p>
              <p className={styles.meta}>
                ใช้งานแล้ว: {invite.usesCount}
                {invite.maxUses !== null ? ` / ${invite.maxUses}` : " ครั้ง"}
                {invite.expiresAt
                  ? ` • หมดอายุ: ${new Date(invite.expiresAt).toLocaleDateString("th-TH")}`
                  : " • ไม่มีวันหมดอายุ"}
              </p>
              {isRevoked ? (
                <span className={styles.statusBadge}>ยกเลิกแล้ว</span>
              ) : isExpired ? (
                <span className={styles.statusBadge}>หมดอายุ</span>
              ) : isMaxed ? (
                <span className={styles.statusBadge}>ครบจำนวน</span>
              ) : null}
            </div>

            <div className={styles.actions}>
              {!isInactive ? (
                <>
                  <Button
                    onClick={() => handleCopyLink(invite.inviteToken, invite.id)}
                    type="button"
                  >
                    {copiedId === invite.id ? "คัดลอกแล้ว!" : "คัดลอกลิงก์"}
                  </Button>
                  <Button
                    disabled={isPending}
                    onClick={() => handleRevoke(invite.id)}
                    type="button"
                    variant="danger"
                  >
                    ยกเลิก
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
