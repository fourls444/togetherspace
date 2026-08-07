import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/app/rooms/new/new-room.module.css";
import { RoomForm } from "@/app/rooms/new/room-form";
import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** แสดงฟอร์มสร้างห้องให้สมาชิกที่ Login แล้วเท่านั้น */
export default async function NewRoomPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/login");

  return (
    <PageShell>
      <div className={styles.content}>
        <Link className={styles.backLink} href="/dashboard">
          ← กลับไปหน้าห้อง
        </Link>
        <Panel className={styles.panel}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>New room</p>
            <h1 className={styles.title}>สร้างห้อง</h1>
          </div>
          <RoomForm />
        </Panel>
      </div>
    </PageShell>
  );
}
