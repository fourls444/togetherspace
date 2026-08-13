"use client";

import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";

import { AtelierIridescence } from "@/components/effects/iridescence/atelier-iridescence";
import { useRoomSidebar } from "@/components/layout/room-sidebar-context";
import styles from "@/components/rooms/room-chrome.module.css";
import type { RoomType } from "@/lib/types/database";

type RoomChromeProps = PropsWithChildren<{
  nav: ReactNode;
  roomType: RoomType;
}>;

export function RoomChrome({ children, nav, roomType }: RoomChromeProps) {
  const { close, isCompact, isOpen, registerSidebar } = useRoomSidebar();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.roomType = roomType;
    return () => {
      delete document.documentElement.dataset.roomType;
    };
  }, [roomType]);

  useEffect(() => {
    registerSidebar(true);
    return () => registerSidebar(false);
  }, [registerSidebar]);

  useEffect(() => {
    if (!isOpen || !isCompact) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, isCompact, isOpen]);

  const placeClass = [
    styles.place,
    ready && isOpen ? styles.isOpen : "",
    ready && !isOpen ? styles.isCollapsed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={placeClass}>
      {isCompact && isOpen ? (
        <button
          aria-label="ปิดเมนูห้อง"
          className={styles.scrim}
          onClick={close}
          type="button"
        />
      ) : null}
      <div className={styles.stageAura} aria-hidden>
        <AtelierIridescence />
        <span className={styles.stageVeil} />
      </div>
      <aside
        className={styles.alcove}
        id="room-alcove"
        inert={ready && !isOpen ? true : undefined}
      >
        {nav}
      </aside>
      <div className={styles.stage}>{children}</div>
    </div>
  );
}
