import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import styles from "@/app/rooms/[roomId]/room-detail.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Panel } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RoomPage({
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

  // Fetch all user rooms for sidebar
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
    .select("id, name, type, avatar_url, created_at")
    .eq("id", roomId)
    .maybeSingle();

  if (roomResult.error) {
    return (
      <div className={styles.container}>
        <Sidebar rooms={sidebarRoomsResult.data ?? []} />
        <PageShell>
          <Link className={styles.backLink} href="/dashboard">
            ← กลับไปหน้า Dashboard
          </Link>
          <div className={styles.error}>
            <ErrorState
              description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
              headingLevel={1}
              title="โหลดข้อมูลห้องไม่สำเร็จ"
            />
          </div>
        </PageShell>
      </div>
    );
  }

  if (!roomResult.data) notFound();

  const membershipsResult = await supabase
    .from("room_members")
    .select("user_id, role, joined_at")
    .eq("room_id", roomId)
    .order("joined_at");

  const memberships = membershipsResult.data ?? [];
  const userIds = memberships.map((membership) => membership.user_id);
  const currentMember = memberships.find((m) => m.user_id === currentUserId);
  const isOwner = currentMember?.role === "owner";

  const profilesResult = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds)
    : { data: [], error: null };

  if (membershipsResult.error || profilesResult.error) {
    return (
      <div className={styles.container}>
        <Sidebar rooms={sidebarRoomsResult.data ?? []} />
        <PageShell>
          <Link className={styles.backLink} href="/dashboard">
            ← กลับไปหน้า Dashboard
          </Link>
          <div className={styles.error}>
            <ErrorState
              description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
              headingLevel={1}
              title="โหลดรายชื่อสมาชิกไม่สำเร็จ"
            />
          </div>
        </PageShell>
      </div>
    );
  }

  const profileById = new Map(
    profilesResult.data?.map((profile) => [profile.id, profile]),
  );
  const members: MemberListItem[] = memberships.map((membership) => {
    const profile = profileById.get(membership.user_id);
    return {
      userId: membership.user_id,
      displayName: profile?.display_name ?? "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      role: membership.role,
    };
  });

  return (
    <div className={styles.container}>
      <Sidebar rooms={sidebarRoomsResult.data ?? []} />
      <PageShell>
        <Link className={styles.backLink} href="/dashboard">
          ← กลับไปหน้า Dashboard
        </Link>

        <Panel as="header" className={styles.headerPanel}>
          <div className={styles.headerContent}>
            <div>
              <p className={styles.eyebrow}>{roomResult.data.type}</p>
              <h1 className={styles.title}>{roomResult.data.name}</h1>
            </div>
            <div className={styles.roomActions}>
              <Badge>{memberships.length} สมาชิก</Badge>
              <ButtonLink href={`/rooms/${roomId}/members`}>
                สมาชิก ({memberships.length})
              </ButtonLink>
              {isOwner ? (
                <ButtonLink href={`/rooms/${roomId}/settings`} variant="primary">
                  ตั้งค่าห้อง
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel className={styles.membersPanel}>
          <div className={styles.membersHeader}>
            <h2 className={styles.membersTitle}>สมาชิกในห้อง</h2>
            <Link href={`/rooms/${roomId}/members`}>ดูสมาชิกทั้งหมด →</Link>
          </div>
          <MemberList members={members} />
        </Panel>
      </PageShell>
    </div>
  );
}
