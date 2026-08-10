import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { RoomRole, RoomType } from "@/lib/types/database";
import { ROOM_ROLE_LABEL, ROOM_TYPE_LABEL } from "@/lib/rooms/labels";
import { getRoomPath } from "@/lib/rooms/room-path";
import styles from "@/components/rooms/room-card.module.css";

type RoomCardProps = {
  room: {
    id: string;
    name: string;
    room_code: string;
    type: RoomType;
    avatar_url?: string | null;
  };
  role: RoomRole;
};

function roomInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

export function RoomCard({ room, role }: RoomCardProps) {
  const avatar = room.avatar_url?.trim();

  return (
    <Link className={styles.card} href={getRoomPath(room.room_code)} prefetch>
      <div className={styles.leading}>
        <div className={styles.avatar} aria-hidden>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className={styles.avatarImage} src={avatar} />
          ) : (
            <span className={styles.avatarInitial}>{roomInitial(room.name)}</span>
          )}
        </div>
        <div className={styles.content}>
          <h2>{room.name}</h2>
          <p>{ROOM_TYPE_LABEL[room.type]}</p>
        </div>
      </div>
      <Badge>{ROOM_ROLE_LABEL[role]}</Badge>
    </Link>
  );
}
