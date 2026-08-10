import Link from "next/link";

import styles from "@/app/(app)/rooms/[roomId]/settings/settings.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { CreateInviteForm } from "@/components/rooms/create-invite-form";
import { InviteList, type InviteListItem } from "@/components/rooms/invite-list";
import { LeaveRoomButton } from "@/components/rooms/leave-room-button";
import {
  MemberManagement,
  type ManageMemberItem,
} from "@/components/rooms/member-management";
import { ButtonLink } from "@/components/ui/button-link";
import { CopyButton } from "@/components/ui/copy-button";
import { ErrorState } from "@/components/ui/error-state";
import { Panel } from "@/components/ui/panel";
import { getRoomContext } from "@/lib/rooms/server";

/** แสดงหน้าตั้งค่าห้อง โดยใช้ room code บน URL แต่ยังส่ง UUID ให้ action ภายใน */
export default async function RoomSettingsPage({
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
            description="ถ้าต้องการตั้งค่าห้องนี้ กรุณาเข้าร่วมห้องก่อน"
            headingLevel={1}
            title="คุณไม่ได้อยู่ในห้องนี้"
          />
        </div>
      </PageShell>
    );
  }

  const { currentUserId, room, roomCode, roomId, roomPath, supabase } =
    context;

  const [memberRecordResult, membershipsResult] = await Promise.all([
    supabase
      .from("room_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", currentUserId)
      .maybeSingle(),
    supabase
      .from("room_members")
      .select(
        "user_id, role, joined_at, profiles(username, display_name, avatar_url)",
      )
      .eq("room_id", roomId)
      .order("joined_at"),
  ]);

  const isOwner = memberRecordResult.data?.role === "owner";
  const memberships = membershipsResult.data ?? [];

  const invitesResult = isOwner
    ? await supabase
        .from("room_invites")
        .select(
          "id, invite_code, invite_token, uses_count, max_uses, expires_at, created_at, revoked_at",
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
    : { data: [] as never[] };

  const members: ManageMemberItem[] = memberships.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      userId: m.user_id,
      displayName: profile?.display_name ?? "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      role: m.role,
    };
  });

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
    <PageShell>
      <Link className={styles.backLink} href={roomPath}>
        ← กลับไปหน้าห้อง ({room.name})
      </Link>
      <Panel className={styles.panel}>
        <h1 className={styles.title}>ตั้งค่าห้อง: {room.name}</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>รหัสห้อง (Room Code)</h2>
          <p className={styles.subText}>
            รหัสถาวรสำหรับให้ผู้ใช้อื่นเข้าร่วมห้องผ่านหน้า Join Room
          </p>
          <div className={styles.codeContainer}>
            <code className={styles.code}>{roomCode}</code>
            <CopyButton
              copiedLabel="คัดลอกแล้ว"
              label="คัดลอกรหัส"
              text={roomCode}
            />
          </div>
        </section>

        {isOwner ? (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>สร้างคำเชิญใหม่</h2>
              <p className={styles.subText}>
                ใช้เมื่อต้องการลิงก์ชั่วคราวที่กำหนดวันหมดอายุหรือจำนวนครั้งได้
              </p>
              <CreateInviteForm roomCode={roomCode} roomId={roomId} />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                รายการคำเชิญที่สร้างไว้ ({invites.length})
              </h2>
              <InviteList invites={invites} roomCode={roomCode} roomId={roomId} />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                จัดการสมาชิก ({members.length})
              </h2>
              <MemberManagement
                currentUserId={currentUserId}
                members={members}
                roomCode={roomCode}
                roomId={roomId}
              />
            </section>
          </>
        ) : (
          <section className={styles.section}>
            <ErrorState
              description="เฉพาะเจ้าของห้องเท่านั้นที่สามารถจัดการคำเชิญและสมาชิกได้"
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
  );
}
