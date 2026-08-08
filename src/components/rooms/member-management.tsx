"use client";

import { useState, useTransition } from "react";

import { changeMemberRole, kickMember } from "@/features/members/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoomRole } from "@/lib/types/database";
import styles from "@/components/rooms/member-management.module.css";

export type ManageMemberItem = {
  userId: string;
  displayName: string;
  username: string;
  role: RoomRole;
};

type MemberManagementProps = {
  roomId: string;
  currentUserId: string;
  members: ManageMemberItem[];
};

export function MemberManagement({
  roomId,
  currentUserId,
  members,
}: MemberManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleKick = (userId: string, name: string) => {
    if (!confirm(`คุณต้องการลบ "${name}" ออกจากห้องใช่หรือไม่?`)) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await kickMember(roomId, userId);
      if (res.error) setErrorMsg(res.error);
    });
  };

  const handleRoleChange = (userId: string, newRole: RoomRole) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await changeMemberRole(roomId, userId, newRole);
      if (res.error) setErrorMsg(res.error);
    });
  };

  return (
    <div className={styles.container}>
      {errorMsg ? <p className={styles.error}>{errorMsg}</p> : null}
      <ul className={styles.list}>
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          return (
            <li className={styles.member} key={member.userId}>
              <div className={styles.info}>
                <p className={styles.name}>{member.displayName}</p>
                <p className={styles.username}>@{member.username}</p>
              </div>

              <div className={styles.actions}>
                {isSelf ? (
                  <Badge>{member.role} (คุณ)</Badge>
                ) : (
                  <>
                    <select
                      className={styles.roleSelect}
                      disabled={isPending}
                      onChange={(e) =>
                        handleRoleChange(
                          member.userId,
                          e.target.value as RoomRole,
                        )
                      }
                      value={member.role}
                    >
                      <option value="member">Member</option>
                      <option value="owner">Owner</option>
                    </select>

                    <Button
                      disabled={isPending}
                      onClick={() =>
                        handleKick(member.userId, member.displayName)
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
        })}
      </ul>
    </div>
  );
}
