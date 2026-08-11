"use client";

import { useState, useTransition } from "react";

import { revokeInvite } from "@/features/invites/actions";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/toast";
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
  createdByName: string;
};

type InviteListProps = {
  invites: InviteListItem[];
  roomCode: string;
  roomId: string;
};

export function InviteList({ invites, roomCode, roomId }: InviteListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  /** คัดลอกลิงก์คำเชิญและแจ้งผลบนหน้าเดิม */
  const handleCopyLink = (token: string, id: string) => {
    const origin = window.location.origin;
    const url = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setToast({ message: "คัดลอกลิงก์คำเชิญแล้ว", tone: "success" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  /** ยกเลิกคำเชิญที่เลือกหลังผู้ใช้ยืนยัน */
  const handleRevoke = () => {
    if (!revokeTarget) return;
    startTransition(async () => {
      const result = await revokeInvite(revokeTarget, roomId, roomCode);
      setToast({
        message: result.error ?? "ยกเลิกคำเชิญแล้ว",
        tone: result.error ? "error" : "success",
      });
      setRevokeTarget(null);
    });
  };

  if (!invites.length) {
    return <p className={styles.empty}>ยังไม่มีรายการคำเชิญที่สร้างไว้</p>;
  }

  return (
    <>
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
                สร้างโดย {invite.createdByName} เมื่อ{" "}
                {new Date(invite.createdAt).toLocaleDateString("th-TH")} • {" "}
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
              ) : (
                <span className={styles.activeBadge}>ใช้งานได้</span>
              )}
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
                    onClick={() => setRevokeTarget(invite.id)}
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
      <ConfirmationDialog
        confirmLabel="ยกเลิกคำเชิญ"
        description="ลิงก์นี้จะใช้เข้าร่วมห้องไม่ได้อีก แต่สมาชิกที่เข้าร่วมแล้วจะไม่ได้รับผลกระทบ"
        isPending={isPending}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        open={Boolean(revokeTarget)}
        title="ยกเลิกคำเชิญนี้?"
        variant="danger"
      />
      <Toast
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        tone={toast?.tone}
      />
    </>
  );
}
