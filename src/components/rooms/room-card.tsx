import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { RoomRole, RoomType } from "@/lib/types/database";
import { ROOM_ROLE_LABEL, ROOM_TYPE_LABEL } from "@/lib/rooms/labels";
import { getRoomPath } from "@/lib/rooms/room-path";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
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

export function RoomCard({ room, role }: RoomCardProps) {
  const avatar = room.avatar_url?.trim() || getDefaultImageUrl("room");

  return (
    <Link className={styles.card} href={getRoomPath(room.room_code)} prefetch>
      <div className={styles.top}>
        <div className={styles.avatar} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className={styles.avatarImage} src={avatar} />
        </div>
        <Badge>{ROOM_ROLE_LABEL[role]}</Badge>
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>{room.name}</h2>
        <p className={styles.meta}>{ROOM_TYPE_LABEL[room.type]}</p>
      </div>
    </Link>
  );
}
