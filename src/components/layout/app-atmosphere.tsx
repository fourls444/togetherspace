import { AppLightfall } from "@/components/layout/app-lightfall";
import styles from "@/components/layout/app-atmosphere.module.css";

/** พื้นหลังหลังล็อกอิน — หมึก + Lightfall */
export function AppAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden>
      <AppLightfall />
    </div>
  );
}
