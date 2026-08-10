import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { RoomRole, RoomType } from "@/lib/types/database";
import { getRoomPath } from "@/lib/rooms/room-path";
import styles from "@/components/rooms/room-card.module.css";

type RoomCardProps = {
  room: {
    id: string;
    name: string;
    room_code: string;
    type: RoomType;
  };
  role: RoomRole;
};

export function RoomCard({ room, role }: RoomCardProps) {
  return (
    <Link className={styles.card} href={getRoomPath(room.room_code)}>
      <div className={styles.content}>
        <h2>{room.name}</h2>
        <p>{room.type}</p>
      </div>
      <Badge>{role}</Badge>
    </Link>
  );
}
