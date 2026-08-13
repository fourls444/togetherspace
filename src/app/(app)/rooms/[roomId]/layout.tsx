import type { PropsWithChildren } from "react";

import { RoomChrome } from "@/components/rooms/room-chrome";
import styles from "@/components/rooms/room-chrome.module.css";
import { RoomNav } from "@/components/rooms/room-nav";
import { RoomThemeProvider } from "@/components/rooms/room-theme-provider";
import { getRoomPath, getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

/** โครงห้อง — alcove ซ้ายเลือกเนื้อหา, ขวาเป็นเวทีเต็มจอ */
export default async function RoomLayout({
  children,
  params,
}: PropsWithChildren<{
  params: Promise<{ roomId: string }>;
}>) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return <div className={styles.guest}>{children}</div>;
  }

  const { roomCode, room } = context;
  const roomPath = getRoomPath(roomCode);

  return (
    <RoomThemeProvider roomCode={roomCode} roomType={room.type}>
      <RoomChrome
        roomType={room.type}
        nav={
          <RoomNav
            items={[
              { href: roomPath, label: "หน้าห้อง", exact: true },
              { href: getRoomSubPath(roomCode, "board"), label: "บอร์ด" },
              { href: getRoomSubPath(roomCode, "calendar"), label: "ปฏิทิน" },
              { href: getRoomSubPath(roomCode, "album"), label: "อัลบั้ม" },
              { href: getRoomSubPath(roomCode, "map"), label: "แผนที่" },
              { href: getRoomSubPath(roomCode, "finance"), label: "การเงิน" },
              { href: getRoomSubPath(roomCode, "members"), label: "คนในห้อง" },
            ]}
            footerItems={[
              { href: getRoomSubPath(roomCode, "settings"), label: "ตั้งค่า" },
            ]}
          />
        }
      >
        {children}
      </RoomChrome>
    </RoomThemeProvider>
  );
}
