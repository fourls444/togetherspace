import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import styles from "@/app/rooms/[roomId]/room-detail.module.css";
import { PageShell } from "@/components/layout/page-shell";
import {
  MemberList,
  type MemberListItem,
} from "@/components/rooms/member-list";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Panel } from "@/components/ui/panel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** โหลดรายละเอียดห้องกับ Profile สมาชิก โดยอาศัย RLS จำกัดการเข้าถึงข้อมูล */
export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!z.string().uuid().safeParse(roomId).success) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims.sub) redirect("/login");

  const roomResult = await supabase
    .from("rooms")
    .select("id, name, type, avatar_url, created_at")
    .eq("id", roomId)
    .maybeSingle();

  if (roomResult.error) {
    return (
      <PageShell>
        <Link className={styles.backLink} href="/dashboard">
          ← กลับไปหน้าห้อง
        </Link>
        <div className={styles.error}>
          <ErrorState
            headingLevel={1}
            title="โหลดข้อมูลห้องไม่สำเร็จ"
            description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
          />
        </div>
      </PageShell>
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
  const profilesResult = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds)
    : { data: [], error: null };

  if (membershipsResult.error || profilesResult.error) {
    return (
      <PageShell>
        <Link className={styles.backLink} href="/dashboard">
          ← กลับไปหน้าห้อง
        </Link>
        <div className={styles.error}>
          <ErrorState
            headingLevel={1}
            title="โหลดรายชื่อสมาชิกไม่สำเร็จ"
            description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
          />
        </div>
      </PageShell>
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
    <PageShell>
      <Link className={styles.backLink} href="/dashboard">
        ← กลับไปหน้าห้อง
      </Link>

      <Panel as="header" className={styles.headerPanel}>
        <div className={styles.headerContent}>
          <div>
            <p className={styles.eyebrow}>{roomResult.data.type}</p>
            <h1 className={styles.title}>{roomResult.data.name}</h1>
          </div>
          <Badge>{memberships.length} สมาชิก</Badge>
        </div>
      </Panel>

      <Panel className={styles.membersPanel}>
        <h2 className={styles.membersTitle}>สมาชิก</h2>
        <MemberList members={members} />
      </Panel>
    </PageShell>
  );
}
