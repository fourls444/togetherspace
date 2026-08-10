import type { PropsWithChildren } from "react";
import Link from "next/link";

import { AuthWavesBackground } from "@/components/auth/auth-waves-background";
import styles from "@/components/auth/auth-shell.module.css";
import { ButtonLink } from "@/components/ui/button-link";

type AuthShellProps = PropsWithChildren<{
  title: string;
  description: string;
  switchPrompt: string;
  switchHref: string;
  switchLabel: string;
  slogan?: string;
  sloganSupport?: string;
  previewLabel?: string;
}>;

const PREVIEW_FEATURES = [
  "อัลบั้มภาพ",
  "ปฏิทินร่วม",
  "แผนที่ความทรงจำ",
  "บันทึกการเงิน",
  "บอร์ดไอเดีย",
  "ห้องของเรา",
];

export function AuthShell({
  children,
  title,
  description,
  switchPrompt,
  switchHref,
  switchLabel,
  slogan = "อยู่ด้วยกัน ครบในที่เดียว",
  sloganSupport = "สร้างพื้นที่ร่วมสำหรับเพื่อน แฟน หรือครอบครัว — อัลบั้ม ปฏิทิน แผนที่ และอีกมากมาย",
  previewLabel = "พรีวิวภาพรวม",
}: AuthShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.waves} aria-hidden>
        <AuthWavesBackground />
      </div>
      <div className={styles.grid}>
        <section className={styles.left} aria-label="เข้าสู่ระบบ">
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden>
              TS
            </span>
            TogetherSpace
          </Link>

          <div className={styles.leftStack}>
            <div className={styles.sloganBlock}>
              <h1 className={styles.slogan}>{slogan}</h1>
              <p className={styles.sloganSupport}>{sloganSupport}</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIntro}>
                <h2 className={styles.cardTitle}>{title}</h2>
                <p className={styles.cardDescription}>{description}</p>
              </div>

              {children}

              <div className={styles.switchAccount}>
                <p>{switchPrompt}</p>
                <ButtonLink href={switchHref} variant="default">
                  {switchLabel}
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.right} aria-label={previewLabel}>
          <div className={styles.previewFrame}>
            <div className={styles.previewHeader}>
              <span className={styles.previewChip}>{previewLabel}</span>
            </div>
            <div className={styles.previewStage}>
              <div className={styles.previewInner}>
                <p className={styles.previewHeading}>TogetherSpace ในพรีวิว</p>
                <p className={styles.previewText}>
                  รวมกิจกรรมสำคัญของกลุ่มไว้ในห้องเดียว ใช้งานง่าย ดูอบอุ่น
                </p>
                <div className={styles.previewGrid}>
                  {PREVIEW_FEATURES.map((label) => (
                    <div key={label} className={styles.previewTile}>
                      {label}
                    </div>
                  ))}
                </div>
                <div className={styles.previewFooter}>
                  <div className={styles.previewPrompt}>
                    สร้างห้องแรกของคุณ แล้วเชิญคนสำคัญเข้ามาได้ทันที
                  </div>
                  <span className={styles.previewCta}>เริ่มต้น →</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
