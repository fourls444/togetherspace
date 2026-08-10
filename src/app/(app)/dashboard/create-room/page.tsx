import styles from "@/app/(app)/dashboard/create-room/create-room.module.css";
import { RoomForm } from "@/app/(app)/dashboard/create-room/room-form";
import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Panel } from "@/components/ui/panel";

/** หน้าสร้างห้อง — auth/sidebar อยู่ใน layout */
export default function CreateRoomPage() {
  return (
    <PageShell>
      <div className={styles.content}>
        <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>
        <Panel className={styles.panel}>
          <div className={styles.intro}>
            <h1 className={styles.title}>สร้างห้อง</h1>
            <p className={styles.subText}>
              เลือกประเภทห้องแล้วตั้งชื่อให้รู้สึกเหมือนบ้านหลังค่ำของคุณ
            </p>
          </div>
          <RoomForm />
        </Panel>
      </div>
    </PageShell>
  );
}
