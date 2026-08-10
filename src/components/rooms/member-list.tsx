import { Badge } from "@/components/ui/badge";
import type { RoomRole } from "@/lib/types/database";
import { ROOM_ROLE_LABEL } from "@/lib/rooms/labels";
import styles from "@/components/rooms/member-list.module.css";

export type MemberListItem = {
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
