"use client";

import Link from "next/link";

import AnimatedList from "@/components/effects/animated-list/AnimatedList";
import styles from "@/components/rooms/room-home.module.css";

type ShelfEntry = {
  id: string;
  meta: string;
  title: string;
};

type RoomShelfListProps = {
  href: string;
  items: ShelfEntry[];
};

export function RoomShelfList({ href, items }: RoomShelfListProps) {
  return (
    <AnimatedList className={styles.shelfList} displayScrollbar showGradients>
      {items.map((item) => (
        <Link className={styles.item} href={href} key={item.id} prefetch>
          <span className={styles.itemTitle}>{item.title}</span>
          <span className={styles.itemMeta}>{item.meta}</span>
        </Link>
      ))}
    </AnimatedList>
  );
}
