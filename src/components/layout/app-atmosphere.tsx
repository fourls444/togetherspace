import { AppFloatingLines } from "@/components/layout/app-floating-lines";
import styles from "@/components/layout/app-atmosphere.module.css";

/** พื้นหลังหลังล็อกอิน — เส้นลอยโทน Atelier */
export function AppAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden>
      <AppFloatingLines />
    </div>
  );
}
