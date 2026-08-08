import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import styles from "@/app/rooms/[roomId]/settings/settings.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { CreateInviteForm } from "@/components/rooms/create-invite-form";
import { InviteList, type InviteListItem } from "@/components/rooms/invite-list";
import { LeaveRoomButton } from "@/components/rooms/leave-room-button";
import {
  MemberManagement,
  type ManageMemberItem,
} from "@/components/rooms/member-management";
import { ErrorState } from "@/components/ui/error-state";
import { Panel } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RoomSettingsPage({
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
    .select("id, name, type, room_code")
    .eq("id", roomId)
    .maybeSingle();

  if (!roomResult.data) notFound();

  // Check current user role
  const { data: memberRecord } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (!memberRecord) notFound();

  const isOwner = memberRecord.role === "owner";

  // Fetch memberships + profiles
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

  const members: ManageMemberItem[] = memberships.map((m) => {
    const profile = profileById.get(m.user_id);
    return {
      userId: m.user_id,
      displayName: profile?.display_name ?? "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      role: m.role,
    };
  });

  // Fetch invites (if owner)
  const invitesResult = isOwner
    ? await supabase
        .from("room_invites")
        .select(
          "id, invite_code, invite_token, uses_count, max_uses, expires_at, created_at, revoked_at",
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
    : { data: [] };

  const invites: InviteListItem[] = (invitesResult.data ?? []).map((inv) => ({
    id: inv.id,
    inviteCode: inv.invite_code,
    inviteToken: inv.invite_token,
    usesCount: inv.uses_count,
    maxUses: inv.max_uses,
    expiresAt: inv.expires_at,
    createdAt: inv.created_at,
    revokedAt: inv.revoked_at,
  }));

  return (
    <div className={styles.container}>
      <Sidebar rooms={sidebarRoomsResult.data ?? []} />
      <PageShell>
        <Link className={styles.backLink} href={`/rooms/${roomId}`}>
          ← กลับไปหน้าห้อง ({roomResult.data.name})
        </Link>
        <Panel className={styles.panel}>
          <h1 className={styles.title}>ตั้งค่าห้อง: {roomResult.data.name}</h1>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>รหัสห้อง (Room Code)</h2>
            <p className={styles.subText}>
              รหัสถาวรสำหรับให้ผู้ใช้อื่นเข้าร่วมห้อง
            </p>
            <div className={styles.codeContainer}>
              <code className={styles.code}>{roomResult.data.room_code}</code>
            </div>
          </section>

          {isOwner ? (
            <>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>สร้างคำเชิญใหม่</h2>
                <CreateInviteForm roomId={roomId} />
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  รายการคำเชิญที่สร้างไว้ ({invites.length})
                </h2>
                <InviteList invites={invites} roomId={roomId} />
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  จัดการสมาชิก ({members.length})
                </h2>
                <MemberManagement
                  currentUserId={currentUserId}
                  members={members}
                  roomId={roomId}
                />
              </section>
            </>
          ) : (
            <section className={styles.section}>
              <ErrorState
                description="เฉพาะ Owner ของห้องเท่านั้นที่สามารถจัดการคำเชิญและสมาชิกได้"
                headingLevel={2}
                title="การเข้าถึงจำกัด"
              />
            </section>
          )}

          <section className={styles.section}>
            <h2 className={`${styles.sectionTitle} ${styles.dangerSection}`}>
              ออกจากห้อง
            </h2>
            <LeaveRoomButton roomId={roomId} />
          </section>
        </Panel>
      </PageShell>
    </div>
  );
}
