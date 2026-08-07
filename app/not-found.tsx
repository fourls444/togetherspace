import styles from "@/app/not-found.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Panel } from "@/components/ui/panel";

/** แสดงทางกลับที่ชัดเจนเมื่อผู้ใช้เปิด route หรือข้อมูลที่ไม่มีอยู่ */
export default function NotFound() {
  return (
    <PageShell className={styles.shell}>
      <Panel className={styles.panel}>
        <p className={styles.eyebrow}>404</p>
        <h1 className={styles.title}>ไม่พบหน้าหรือไม่มีสิทธิ์เข้าถึง</h1>
        <p className={styles.description}>
          ตรวจสอบลิงก์อีกครั้ง หรือกลับไปเลือกห้องที่คุณเป็นสมาชิก
        </p>
        <ButtonLink
          className={styles.action}
          href="/dashboard"
          variant="primary"
        >
          กลับไปหน้าห้อง
        </ButtonLink>
      </Panel>
    </PageShell>
  );
}
