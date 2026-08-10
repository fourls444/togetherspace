import styles from "@/app/(app)/dashboard/join-room/join-room.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { JoinForm } from "@/components/rooms/join-form";
import { ButtonLink } from "@/components/ui/button-link";
import { Panel } from "@/components/ui/panel";

/** หน้าเข้าร่วมห้อง — auth/sidebar อยู่ใน layout */
export default function JoinRoomPage() {
  return (
    <PageShell>
      <div className={styles.content}>
        <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>
        <Panel className={styles.panel}>
          <div className={styles.intro}>
            <h1 className={styles.title}>เข้าร่วมห้องด้วยรหัส</h1>
            <p className={styles.subText}>
              กรอกรหัสห้อง (6 หลัก) หรือรหัสคำเชิญที่ได้รับจากเจ้าของห้อง
            </p>
          </div>
          <div className={styles.tips}>
            <p className={styles.tipsTitle}>ใช้รหัสแบบไหน?</p>
            <p className={styles.subText}>
              รหัสห้องเป็นรหัสถาวรจากหน้าตั้งค่า ส่วนรหัสคำเชิญอาจมีวันหมดอายุ
              หรือจำกัดจำนวนครั้งที่ใช้ได้
            </p>
          </div>
          <JoinForm />
        </Panel>
      </div>
    </PageShell>
  );
}
