import styles from "@/app/(app)/dashboard/create-room/create-room.module.css";
import { CreateRoomExperience } from "@/app/(app)/dashboard/create-room/create-room-experience";
import { ButtonLink } from "@/components/ui/button-link";

export default function CreateRoomPage() {
  return (
    <div className={styles.wrap}>
      <ButtonLink className={styles.backButton} href="/dashboard">
        กลับหน้าแรก
      </ButtonLink>
      <CreateRoomExperience />
    </div>
  );
}
