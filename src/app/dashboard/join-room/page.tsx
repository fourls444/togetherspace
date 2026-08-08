import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/app/dashboard/join-room/join-room.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { JoinForm } from "@/components/rooms/join-form";
import { Panel } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JoinRoomPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");

  const membershipsResult = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", userId);

  const roomIds = membershipsResult.data?.map((m) => m.room_id) ?? [];
  const roomsResult = roomIds.length
    ? await supabase.from("rooms").select("id, name, avatar_url").in("id", roomIds)
    : { data: [] };

  return (
    <div className={styles.container}>
      <Sidebar rooms={roomsResult.data ?? []} />
      <PageShell>
        <div className={styles.content}>
          <Link className={styles.backLink} href="/dashboard">
            ← กลับไปหน้าห้อง
          </Link>
          <Panel className={styles.panel}>
            <div className={styles.intro}>
              <p className={styles.eyebrow}>Join room</p>
              <h1 className={styles.title}>เข้าร่วมห้องด้วยรหัส</h1>
              <p className={styles.subText}>
                กรอกรหัสห้อง (6 หลัก) หรือ รหัสคำเชิญที่ได้รับจากเจ้าของห้อง
              </p>
            </div>
            <JoinForm />
          </Panel>
        </div>
      </PageShell>
    </div>
  );
}
