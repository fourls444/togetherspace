import styles from "@/app/(app)/dashboard/join-room/join-room.module.css";
import { JoinForm } from "@/components/rooms/join-form";
import { ButtonLink } from "@/components/ui/button-link";

export default function JoinRoomPage() {
  return (
    <div className={styles.wrap}>
      <ButtonLink className={styles.back} href="/dashboard">
        ← กลับหน้าแรก
      </ButtonLink>
      <div className={styles.panel}>
        <div className={styles.intro}>
          <h1 className={styles.title}>เข้าห้องด้วยรหัส</h1>
          <p className={styles.lead}>
            ใส่รหัสที่เจ้าของห้องส่งมา — อาจเป็นรหัสห้องถาวร หรือรหัสคำเชิญชั่วคราว
          </p>
        </div>
        <div className={styles.tip}>
          <p className={styles.tipStrong}>ต่างกันยังไง?</p>
          <p>
            รหัสห้องใช้ได้เรื่อยๆ จากหน้าดูแลห้อง ส่วนรหัสคำเชิญอาจหมดอายุ
            หรือใช้ได้จำกัดครั้ง
          </p>
        </div>
        <JoinForm />
      </div>
    </div>
  );
}
