import type { PropsWithChildren } from "react";

import styles from "@/components/rooms/room-chrome.module.css";
import { RoomNav } from "@/components/rooms/room-nav";
import { ButtonLink } from "@/components/ui/button-link";
import { ROOM_TYPE_LABEL } from "@/lib/rooms/labels";
import { getRoomPath, getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

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

  const { room, roomCode, roomId, supabase } = context;
  const avatar = room.avatar_url?.trim() || getDefaultImageUrl("room");
  const roomPath = getRoomPath(roomCode);
  const { count: memberCount } = await supabase
    .from("room_members")
    .select("user_id", { count: "exact", head: true })
    .eq("room_id", roomId);

  return (
    <div className={styles.place}>
      <ButtonLink className={styles.backButton} href="/dashboard">
        กลับหน้าแรก
      </ButtonLink>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.identity}>
            <div className={styles.avatar} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className={styles.avatarImage} src={avatar} />
            </div>
            <div>
              <p className={styles.type}>{ROOM_TYPE_LABEL[room.type]}</p>
              <h1 className={styles.name}>{room.name}</h1>
            </div>
          </div>
          <div className={styles.headerFacts}>
            <div>
              <span>สมาชิก</span>
              <strong>{memberCount ?? 0} คน</strong>
            </div>
            <div>
              <span>รหัสห้อง</span>
              <strong>{roomCode}</strong>
            </div>
          </div>
        </div>
        <div className={styles.overview} aria-label="มุมหลักของห้อง">
          <p className={styles.overviewKicker}>มุมหลักของห้อง</p>
          <p className={styles.overviewText}>
            รวมทางเข้าไปยังปฏิทิน อัลบั้ม บอร์ด และสมาชิกของห้องนี้
          </p>
        </div>
        <RoomNav
          items={[
            { href: roomPath, label: "หน้าหลัก", exact: true },
            { href: getRoomSubPath(roomCode, "board"), label: "บอร์ด" },
            { href: getRoomSubPath(roomCode, "calendar"), label: "ปฏิทิน" },
            { href: getRoomSubPath(roomCode, "album"), label: "อัลบั้ม" },
            { href: getRoomSubPath(roomCode, "members"), label: "สมาชิกในห้อง" },
            { href: getRoomSubPath(roomCode, "settings"), label: "ตั้งค่าห้อง" },
          ]}
        />
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
