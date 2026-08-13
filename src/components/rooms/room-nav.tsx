"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleDollarSign,
  Home,
  Images,
  MapPinned,
  Settings,
  StickyNote,
  Users,
  type LucideIcon,
} from "lucide-react";

import styles from "@/components/rooms/room-chrome.module.css";

type RoomNavProps = {
  items: { href: string; label: string; exact?: boolean }[];
};

const NAV_ICON_BY_SEGMENT: Record<string, LucideIcon> = {
  album: Images,
  board: StickyNote,
  calendar: CalendarDays,
  finance: CircleDollarSign,
  map: MapPinned,
  members: Users,
  settings: Settings,
};

export function RoomNav({ items }: RoomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="ในห้องนี้">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const segment = item.href.split("/").filter(Boolean).at(-1) ?? "";
        const Icon = item.exact ? Home : (NAV_ICON_BY_SEGMENT[segment] ?? StickyNote);
        return (
          <Link
            className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            href={item.href}
            key={item.href}
            prefetch
          >
            <Icon aria-hidden size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
