import styles from "@/components/layout/app-atmosphere.module.css";

/** พื้นหลังบรรยากาศแบบ CSS — ไม่ใช้ WebGL เพื่อให้สลับหน้าได้ลื่น */
export function AppAtmosphere() {
  return <div className={styles.atmosphere} aria-hidden />;
}
