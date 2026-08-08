"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/components/layout/sidebar.module.css";

type RoomSidebarItem = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type SidebarProps = {
  rooms: RoomSidebarItem[];
};

export function Sidebar({ rooms }: SidebarProps) {
  const pathname = usePathname();

  function getInitials(name: string) {
    return name.trim().slice(0, 2).toUpperCase();
  }

  return (
    <aside className={styles.sidebar}>
      <Link
        className={`${styles.navItem} ${
          pathname === "/dashboard" ? styles.active : ""
        }`}
        href="/dashboard"
      >
        <span>หน้าหลัก</span>
      </Link>

      <div className={styles.divider} />

      <div className={styles.roomList}>
        {rooms.map((room) => {
          const isCurrentRoom = pathname.startsWith(`/rooms/${room.id}`);
          return (
            <Link
              className={`${styles.navItem} ${
                isCurrentRoom ? styles.active : ""
              }`}
              href={`/rooms/${room.id}`}
              key={room.id}
            >
              <span>{getInitials(room.name)}</span>
              <span className={styles.tooltip}>{room.name}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.divider} />

      <Link
        className={`${styles.navItem} ${
          pathname === "/dashboard/create-room" ? styles.active : ""
        }`}
        href="/dashboard/create-room"
      >
        <span>สร้างห้อง</span>
      </Link>

      <Link
        className={`${styles.navItem} ${
          pathname === "/dashboard/join-room" ? styles.active : ""
        }`}
        href="/dashboard/join-room"
      >
        <span>เข้าร่วม</span>
      </Link>
    </aside>
  );
}
