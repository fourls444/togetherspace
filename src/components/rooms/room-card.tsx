import Link from "next/link";
import type { CSSProperties } from "react";

import { LivingCard } from "@/components/effects/living-card";
import { Badge } from "@/components/ui/badge";
import type { RoomRole, RoomType } from "@/lib/types/database";
import {
  ROOM_ROLE_LABEL,
  ROOM_TYPE_BLURB,
  ROOM_TYPE_LABEL,
  ROOM_TYPE_THEME,
} from "@/lib/rooms/labels";
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
  memberCount?: number;
};

export function RoomCard({ room, role, memberCount }: RoomCardProps) {
  const avatar = room.avatar_url?.trim() || getDefaultImageUrl("room");
  const theme = ROOM_TYPE_THEME[room.type];
  const accentStyle = {
    "--room-accent": theme.accent,
  } as CSSProperties;
  const people =
    typeof memberCount === "number" && memberCount > 0
      ? `${memberCount} คนในห้อง`
      : null;

  return (
    <LivingCard className={styles.liveWrap} glowRgb={theme.sparkRgb}>
      <Link
        className={`${styles.card} ${styles[room.type]}`}
        href={getRoomPath(room.room_code)}
        prefetch
        style={accentStyle}
      >
      <div className={styles.top}>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className={styles.avatarImage} src={avatar} />
          </div>
          <span className={styles.typePill}>{ROOM_TYPE_LABEL[room.type]}</span>
        </div>
        <Badge>{ROOM_ROLE_LABEL[role]}</Badge>
      </div>

      <div className={styles.body}>
        <h2 className={styles.name}>{room.name}</h2>
        <p className={styles.blurb}>{ROOM_TYPE_BLURB[room.type]}</p>
      </div>

      {people ? (
        <div className={styles.footer}>
          <span className={styles.people}>{people}</span>
        </div>
      ) : null}
    </Link>
    </LivingCard>
  );
}
