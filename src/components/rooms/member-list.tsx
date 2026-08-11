import { Badge } from "@/components/ui/badge";
import type { RoomRole } from "@/lib/types/database";
import { ROOM_ROLE_LABEL } from "@/lib/rooms/labels";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
import styles from "@/components/rooms/member-list.module.css";

export type MemberListItem = {
  avatarUrl: string | null;
  userId: string;
  displayName: string;
  username: string;
  role: RoomRole;
};

type MemberListProps = {
  members: MemberListItem[];
};

export function MemberList({ members }: MemberListProps) {
  return (
    <ul className={styles.list}>
      {members.map((member) => (
        <li className={styles.member} key={member.userId}>
          <div className={styles.avatar} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={member.avatarUrl || getDefaultImageUrl("profile")} />
          </div>
          <div className={styles.content}>
            <p className={styles.name}>{member.displayName}</p>
            <p className={styles.username}>@{member.username}</p>
          </div>
          <Badge>{ROOM_ROLE_LABEL[member.role]}</Badge>
        </li>
      ))}
    </ul>
  );
}
