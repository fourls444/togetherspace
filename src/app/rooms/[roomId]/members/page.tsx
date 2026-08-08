import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import styles from "@/app/rooms/[roomId]/members/members.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { Panel } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RoomMembersPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!z.string().uuid().safeParse(roomId).success) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const currentUserId = claimsData?.claims.sub;
  if (!currentUserId) redirect("/login");

  // User rooms for sidebar
  const userMembershipsResult = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_id", currentUserId);

  const userRoomIds = userMembershipsResult.data?.map((m) => m.room_id) ?? [];
  const sidebarRoomsResult = userRoomIds.length
    ? await supabase.from("rooms").select("id, name, avatar_url").in("id", userRoomIds)
    : { data: [] };

  const roomResult = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", roomId)
    .maybeSingle();

  if (!roomResult.data) notFound();

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

  const profileById = new Map(
    profilesResult.data?.map((p) => [p.id, p]),
  );

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
    <div className={styles.container}>
      <Sidebar rooms={sidebarRoomsResult.data ?? []} />
      <PageShell>
        <Link className={styles.backLink} href={`/rooms/${roomId}`}>
          ← กลับไปหน้าห้อง ({roomResult.data.name})
        </Link>
        <Panel className={styles.panel}>
          <h1 className={styles.title}>สมาชิกในห้อง ({members.length})</h1>
          <MemberList members={members} />
        </Panel>
      </PageShell>
    </div>
  );
}
