import styles from "@/app/(app)/loading.module.css";

/** แสดงระหว่างรอหน้าใหม่ — shell (sidebar/คลื่น) ยังอยู่ */
export default function AppLoading() {
  return (
    <div className={styles.shell} aria-busy="true" aria-live="polite">
      <div className={styles.hero}>
        <div className={styles.identity}>
          <div className={styles.avatar} />
          <div className={styles.heroCopy}>
            <div className={styles.lineWide} />
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat} />
          <div className={styles.stat} />
        </div>
      </div>
      <div className={styles.mainGrid}>
        <div className={`${styles.card} ${styles.album}`} />
        <div className={styles.sideStack}>
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
      </div>
      <div className={styles.bottomGrid}>
        <div className={styles.cardSmall} />
        <div className={styles.cardSmall} />
        <div className={styles.cardSmall} />
      </div>
    </div>
  );
}
