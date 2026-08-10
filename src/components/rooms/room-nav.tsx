"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/components/rooms/room-chrome.module.css";

type RoomNavProps = {
  items: { href: string; label: string; exact?: boolean }[];
};

export function RoomNav({ items }: RoomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="ในห้องนี้">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            href={item.href}
            key={item.href}
            prefetch
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
