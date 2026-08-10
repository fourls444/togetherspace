import styles from "@/app/(app)/dashboard/create-room/create-room.module.css";
import { RoomForm } from "@/app/(app)/dashboard/create-room/room-form";
import { ButtonLink } from "@/components/ui/button-link";

export default function CreateRoomPage() {
  return (
    <div className={styles.wrap}>
      <ButtonLink className={styles.back} href="/dashboard">
        ← กลับหน้าแรก
      </ButtonLink>
      <div className={styles.panel}>
        <div className={styles.intro}>
          <h1 className={styles.title}>สร้างห้องใหม่</h1>
          <p className={styles.lead}>
            ตั้งชื่อห้องแล้วเลือกว่าเป็นพื้นที่ของเพื่อน คู่รัก หรือครอบครัว
          </p>
        </div>
        <RoomForm />
      </div>
    </div>
  );
}
