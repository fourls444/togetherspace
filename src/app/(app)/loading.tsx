import styles from "@/app/(app)/loading.module.css";

/** แสดงระหว่างรอหน้าใหม่ — shell (sidebar/คลื่น) ยังอยู่ */
export default function AppLoading() {
  return (
    <div className={styles.shell} aria-busy="true" aria-live="polite">
      <div className={styles.hero}>
        <div className={styles.avatar} />
        <div className={styles.heroCopy}>
          <div className={styles.kicker} />
          <div className={styles.lineWide} />
          <div className={styles.line} />
        </div>
        <div className={styles.stats}>
          <div className={styles.stat} />
          <div className={styles.stat} />
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.cardLarge} />
        <div className={styles.card} />
      </div>
    </div>
  );
}
