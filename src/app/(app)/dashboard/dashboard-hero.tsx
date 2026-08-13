"use client";

import styles from "@/app/(app)/dashboard/dashboard.module.css";
import { AtelierIridescence } from "@/components/effects/iridescence/atelier-iridescence";
import { GlowCard } from "@/components/ui/glow-card";
import { SpecularCtaLink } from "@/components/ui/specular-cta";

type DashboardHeroProps = {
  displayName: string;
};

/** การ์ดต้อนรับแดชบอร์ด — ไหมโลหะแชมเปญบนหมึก */
export function DashboardHero({ displayName }: DashboardHeroProps) {
  return (
    <GlowCard
      animated
      aria-label="ยินดีต้อนรับ"
      className={styles.heroShell}
      contentClassName={styles.hero}
      tone="room"
    >
      <div aria-hidden className={styles.heroAura}>
        <AtelierIridescence />
        <span className={styles.heroScrim} />
      </div>
      <div className={styles.heroBody}>
        <p className={styles.greeting}>สวัสดี {displayName}</p>
        <h1 className={styles.title}>ห้องหลังค่ำของคุณ</h1>
        <p className={styles.lead}>
          พื้นที่เงียบสงบสำหรับเพื่อน คู่รัก หรือครอบครัว
          เข้าไปในห้อง หรือชวนคนสำคัญมาอยู่ด้วยกัน
        </p>
        <div className={styles.heroActions}>
          <SpecularCtaLink href="/dashboard/create-room">
            สร้างห้องใหม่
          </SpecularCtaLink>
          <SpecularCtaLink href="/dashboard/join-room" tone="secondary">
            เข้าร่วมด้วยรหัส
          </SpecularCtaLink>
        </div>
      </div>
    </GlowCard>
  );
}
