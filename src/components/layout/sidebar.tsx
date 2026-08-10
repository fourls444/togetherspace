"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getRoomPath } from "@/lib/rooms/room-path";
import styles from "@/components/layout/sidebar.module.css";

export type RoomSidebarItem = {
  id: string;
  name: string;
  room_code: string;
  avatar_url?: string | null;
};

type SidebarProps = {
  rooms: RoomSidebarItem[];
};

function roomInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

export function Sidebar({ rooms }: SidebarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";
  const isCreate = pathname.startsWith("/dashboard/create-room");
  const isJoin = pathname.startsWith("/dashboard/join-room");

  return (
    <aside className={styles.sidebar} aria-label="สลับห้อง">
      <Link
        className={`${styles.homeItem} ${isHome ? styles.activeHome : ""}`}
        href="/dashboard"
      >
        <span className={styles.homeGlyph} aria-hidden>
          บ้าน
        </span>
        <span className={styles.itemLabel}>หน้าหลัก</span>
      </Link>

      <div className={styles.divider} aria-hidden />

      <div className={styles.roomList}>
        {rooms.map((room) => {
          const roomPath = getRoomPath(room.room_code);
          const isCurrentRoom = pathname.startsWith(roomPath);
          const avatar = room.avatar_url?.trim();

          return (
            <Link
              className={`${styles.roomItem} ${
                isCurrentRoom ? styles.activeRoom : ""
              }`}
              href={roomPath}
              key={room.id}
            >
              <span className={styles.roomPill} aria-hidden />
              <span className={styles.roomAvatar}>
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className={styles.roomImage} src={avatar} />
                ) : (
                  <span className={styles.roomInitial}>
                    {roomInitial(room.name)}
                  </span>
                )}
              </span>
              <span className={styles.itemLabel}>{room.name}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.bottomActions}>
        <div className={styles.divider} aria-hidden />
        <Link
          className={`${styles.actionItem} ${isCreate ? styles.activeAction : ""}`}
          href="/dashboard/create-room"
        >
          <span className={styles.actionGlyph} aria-hidden>
            +
          </span>
          <span className={styles.itemLabel}>สร้าง</span>
        </Link>
        <Link
          className={`${styles.actionItem} ${isJoin ? styles.activeAction : ""}`}
          href="/dashboard/join-room"
        >
          <span className={styles.actionGlyphSmall} aria-hidden>
            เข้า
          </span>
          <span className={styles.itemLabel}>เข้าร่วม</span>
        </Link>
      </div>
    </aside>
  );
}
