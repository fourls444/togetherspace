import type { PropsWithChildren } from "react";

import styles from "@/components/rooms/room-chrome.module.css";
import { RoomNav } from "@/components/rooms/room-nav";
import { ButtonLink } from "@/components/ui/button-link";
import { ROOM_TYPE_LABEL } from "@/lib/rooms/labels";
import { getRoomPath, getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

function roomInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

/** โครงห้อง — เข้าอยู่สถานที่ ไม่ใช่สลับเซิร์ฟเวอร์ */
export default async function RoomLayout({
  children,
  params,
}: PropsWithChildren<{
  params: Promise<{ roomId: string }>;
}>) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return <>{children}</>;
  }

  const { room, roomCode } = context;
  const avatar = room.avatar_url?.trim();
  const roomPath = getRoomPath(roomCode);

  return (
    <div className={styles.place}>
      <header className={styles.header}>
        <ButtonLink className={styles.backButton} href="/dashboard">
          กลับหน้าแรก
        </ButtonLink>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className={styles.avatarImage} src={avatar} />
            ) : (
              <span className={styles.avatarInitial}>
                {roomInitial(room.name)}
              </span>
            )}
          </div>
          <div>
            <p className={styles.type}>{ROOM_TYPE_LABEL[room.type]}</p>
            <h1 className={styles.name}>{room.name}</h1>
          </div>
        </div>
        <RoomNav
          items={[
            { href: roomPath, label: "หน้าห้อง", exact: true },
            { href: getRoomSubPath(roomCode, "board"), label: "บอร์ด" },
            { href: getRoomSubPath(roomCode, "members"), label: "คนในห้อง" },
            { href: getRoomSubPath(roomCode, "settings"), label: "แชร์ห้อง" },
          ]}
        />
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
