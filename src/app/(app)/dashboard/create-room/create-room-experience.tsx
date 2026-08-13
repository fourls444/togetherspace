"use client";

import { useState } from "react";

import { RoomForm } from "@/app/(app)/dashboard/create-room/room-form";
import styles from "@/app/(app)/dashboard/create-room/create-room.module.css";
import { GlowCard } from "@/components/ui/glow-card";
import { ROOM_TYPE_THEME } from "@/lib/rooms/labels";
import type { RoomType } from "@/lib/types/database";

/** ฟอร์มสร้างห้อง — เลือกประเภทแล้วแสงโคมทั้งหน้าเปลี่ยนตาม */
export function CreateRoomExperience() {
  const [type, setType] = useState<RoomType>("friend");
  const theme = ROOM_TYPE_THEME[type];

  return (
    <GlowCard
      animated
      colors={[...theme.colors]}
      contentClassName={styles.panel}
      glowColor={theme.glowColor}
      roomType={type}
      tone="room"
    >
      <div className={styles.intro}>
        <h1 className={styles.title}>สร้างห้องใหม่</h1>
        <p className={styles.lead}>
          ตั้งชื่อห้องแล้วเลือกว่าเป็นพื้นที่ของเพื่อน คู่รัก หรือครอบครัว
        </p>
      </div>
      <RoomForm onTypeChange={setType} type={type} />
    </GlowCard>
  );
}
