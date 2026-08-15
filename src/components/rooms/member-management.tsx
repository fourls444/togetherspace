"use client";

import { useRef, useState, useTransition } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { changeMemberRole, kickMember } from "@/features/members/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/toast";
import {
  getNextMemberLimit,
  getVisibleMembers,
  MEMBER_PAGE_SIZE,
} from "@/components/rooms/member-visibility";
import { ROOM_ROLE_LABEL } from "@/lib/rooms/labels";
import type { RoomRole } from "@/lib/types/database";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
import styles from "@/components/rooms/member-management.module.css";

export type ManageMemberItem = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: RoomRole;
};

type MemberManagementProps = {
  currentUserId: string;
  members: ManageMemberItem[];
  roomCode: string;
  roomId: string;
};

export function MemberManagement({
  currentUserId,
  members,
  roomCode,
  roomId,
}: MemberManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [visibleLimit, setVisibleLimit] = useState(MEMBER_PAGE_SIZE);
  const [kickTarget, setKickTarget] = useState<{
    name: string;
    userId: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const listParentRef = useRef<HTMLDivElement>(null);

  /** นำสมาชิกที่เลือกออกจากห้องหลังยืนยัน */
  const handleKick = () => {
    if (!kickTarget) return;
    startTransition(async () => {
      const res = await kickMember(roomId, kickTarget.userId, roomCode);
      if (res.error) {
        setToast({ message: res.error, tone: "error" });
      } else {
        setToast({ message: `นำ ${kickTarget.name} ออกจากห้องแล้ว`, tone: "success" });
      }
      setKickTarget(null);
    });
  };

  /** เปลี่ยนบทบาทสมาชิกและแจ้งผลลัพธ์บนหน้าเดิม */
  const handleRoleChange = (userId: string, newRole: RoomRole) => {
    startTransition(async () => {
      const res = await changeMemberRole(roomId, userId, newRole, roomCode);
      setToast({
        message: res.error ?? "เปลี่ยนบทบาทสมาชิกแล้ว",
        tone: res.error ? "error" : "success",
      });
    });
  };

  /** แสดงสมาชิกเพิ่มครั้งละ 20 คนโดยไม่เกินจำนวนสมาชิกทั้งหมด */
  const handleLoadMore = () => {
    setVisibleLimit((current) =>
      getNextMemberLimit(current, members.length),
    );
  };

  const visibleMembers = getVisibleMembers(members, visibleLimit);
  // TanStack Virtual คืนฟังก์ชันภายใน hook เอง จึงปิด warning React Compiler เฉพาะจุดนี้
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: visibleMembers.length,
    estimateSize: () => 78,
    getScrollElement: () => listParentRef.current,
    overscan: 6,
  });
  const shouldVirtualize = visibleMembers.length > MEMBER_PAGE_SIZE;

  /** แสดงแถวสมาชิกหนึ่งคน ใช้ซ้ำได้ทั้ง list ปกติและ list แบบ virtual */
  const renderMember = (
    member: ManageMemberItem,
    virtualRow?: { index: number; start: number },
  ) => {
    const isSelf = member.userId === currentUserId;
    const avatarUrl = member.avatarUrl?.trim() || getDefaultImageUrl("profile");

    return (
      <li
        className={styles.member}
        data-index={virtualRow?.index}
        key={member.userId}
        ref={virtualRow ? virtualizer.measureElement : undefined}
        style={
          virtualRow
            ? { transform: `translateY(${virtualRow.start}px)` }
            : undefined
        }
      >
        <div className={styles.identity}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className={styles.avatar} src={avatarUrl} />
          <div className={styles.info}>
            <p className={styles.name}>{member.displayName}</p>
            <p className={styles.username}>@{member.username}</p>
          </div>
        </div>

        <div className={styles.actions}>
          {isSelf ? (
            <Badge>
              {ROOM_ROLE_LABEL[member.role]} (คุณ)
            </Badge>
          ) : (
            <>
              <select
                className={styles.roleSelect}
                disabled={isPending}
                onChange={(e) =>
                  handleRoleChange(member.userId, e.target.value as RoomRole)
                }
                value={member.role}
              >
                <option value="member">{ROOM_ROLE_LABEL.member}</option>
                <option value="owner">{ROOM_ROLE_LABEL.owner}</option>
              </select>

              <Button
                disabled={isPending}
                onClick={() =>
                  setKickTarget({
                    name: member.displayName,
                    userId: member.userId,
                  })
                }
                type="button"
                variant="danger"
              >
                ลบออก
              </Button>
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className={styles.container}>
      {shouldVirtualize ? (
        <div className={styles.virtualFrame} ref={listParentRef}>
          <ul
            className={styles.list}
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const member = visibleMembers[virtualRow.index];
              if (!member) return null;
              return renderMember(member, virtualRow);
            })}
          </ul>
        </div>
      ) : (
        <ul className={styles.staticList}>
          {visibleMembers.map((member) => renderMember(member))}
        </ul>
      )}
      {visibleLimit < members.length ? (
        <Button onClick={handleLoadMore} type="button">
          โหลดสมาชิกเพิ่ม ({members.length - visibleLimit})
        </Button>
      ) : null}
      <ConfirmationDialog
        confirmLabel="นำออกจากห้อง"
        description={
          kickTarget
            ? `${kickTarget.name} จะไม่สามารถเข้าถึงข้อมูลในห้องนี้ได้จนกว่าจะเข้าร่วมใหม่`
            : ""
        }
        isPending={isPending}
        onCancel={() => setKickTarget(null)}
        onConfirm={handleKick}
        open={Boolean(kickTarget)}
        title="นำสมาชิกออกจากห้อง?"
        variant="danger"
      />
      <Toast
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        tone={toast?.tone}
      />
    </div>
  );
}
