"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import LineSidebar from "@/components/effects/line-sidebar/LineSidebar";
import styles from "@/components/rooms/room-chrome.module.css";

type RoomNavItem = {
  href: string;
  icon?: ReactNode;
  label: string;
  exact?: boolean;
  compact?: "primary" | "more";
};

type RoomNavProps = {
  items: RoomNavItem[];
  footerItems?: RoomNavItem[];
};

function isActive(pathname: string, item: RoomNavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function RoomNav({ items, footerItems = [] }: RoomNavProps) {
  const pathname = usePathname();
  const active = [...items, ...footerItems].find((item) =>
    isActive(pathname, item),
  );

  return (
    <LineSidebar
      activeHref={active?.href ?? null}
      className={styles.nav}
      footerItems={footerItems.map((item) => ({
        compact: item.compact ?? "more",
        href: item.href,
        icon: item.icon,
        label: item.label,
      }))}
      items={items.map((item) => ({
        compact: item.compact,
        href: item.href,
        icon: item.icon,
        label: item.label,
      }))}
      rail
    />
  );
}
