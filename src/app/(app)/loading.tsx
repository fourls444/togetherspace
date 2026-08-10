import styles from "@/app/(app)/loading.module.css";

/** แสดงระหว่างรอหน้าใหม่ — shell (sidebar/คลื่น) ยังอยู่ */
export default function AppLoading() {
  return (
    <div className={styles.shell} aria-busy="true" aria-live="polite">
      <div className={styles.block}>
        <div className={styles.lineWide} />
        <div className={styles.line} />
      </div>
      <div className={styles.card} />
      <div className={styles.card} />
    </div>
  );
}
