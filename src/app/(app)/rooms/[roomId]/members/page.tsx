import Link from "next/link";

import styles from "@/app/(app)/rooms/[roomId]/members/members.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Panel } from "@/components/ui/panel";
import { getRoomContext } from "@/lib/rooms/server";

/** แสดงสมาชิกทั้งหมดของห้อง โดย URL ใช้ room code แทน UUID */
export default async function RoomMembersPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <PageShell>
        <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>
        <div className={styles.error}>
          <ErrorState
            description="ถ้าต้องการดูสมาชิกห้องนี้ กรุณาเข้าร่วมห้องก่อน"
            headingLevel={1}
            title="คุณไม่ได้อยู่ในห้องนี้"
          />
        </div>
      </PageShell>
    );
  }

  const { room, roomId, roomPath, supabase } = context;

  const membershipsResult = await supabase
    .from("room_members")
    .select("user_id, role, joined_at")
    .eq("room_id", roomId)
    .order("joined_at");

  const memberships = membershipsResult.data ?? [];
  const userIds = memberships.map((m) => m.user_id);

  const profilesResult = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds)
    : { data: [] };

  const profileById = new Map(profilesResult.data?.map((p) => [p.id, p]));

  const members: MemberListItem[] = memberships.map((m) => {
    const profile = profileById.get(m.user_id);
    return {
      userId: m.user_id,
      displayName: profile?.display_name ?? "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      role: m.role,
    };
  });

  return (
    <PageShell>
      <Link className={styles.backLink} href={roomPath}>
        ← กลับไปหน้าห้อง ({room.name})
      </Link>
      <Panel className={styles.panel}>
        <h1 className={styles.title}>สมาชิกในห้อง ({members.length})</h1>
        <MemberList members={members} />
      </Panel>
    </PageShell>
  );
}
