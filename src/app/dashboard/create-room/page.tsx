import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/app/dashboard/create-room/create-room.module.css";
import { RoomForm } from "@/app/dashboard/create-room/room-form";
import { PageShell } from "@/components/layout/page-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Panel } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CreateRoomPage() {
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
              <p className={styles.eyebrow}>New room</p>
              <h1 className={styles.title}>สร้างห้อง</h1>
            </div>
            <RoomForm />
          </Panel>
        </div>
      </PageShell>
    </div>
  );
}
