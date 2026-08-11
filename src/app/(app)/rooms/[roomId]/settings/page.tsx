import styles from "@/app/(app)/rooms/[roomId]/settings/settings.module.css";
import { CreateInviteForm } from "@/components/rooms/create-invite-form";
import { InviteList, type InviteListItem } from "@/components/rooms/invite-list";
import { LeaveRoomButton } from "@/components/rooms/leave-room-button";
import {
  MemberManagement,
  type ManageMemberItem,
} from "@/components/rooms/member-management";
import { RoomProfileForm } from "@/components/rooms/room-profile-form";
import { ButtonLink } from "@/components/ui/button-link";
import { CopyButton } from "@/components/ui/copy-button";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomContext } from "@/lib/rooms/server";

/** แชร์ห้อง — รหัส/คำเชิญ ดูแลสมาชิก และออกจากห้อง */
export default async function RoomSettingsPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.stack}>
        <ErrorState
          description="ถ้าต้องการดูแลห้องนี้ กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  const { currentUserId, roomCode, roomId, supabase } = context;

  const [
    memberRecordResult,
    membershipsResult,
    profileResult,
    roomProfileResult,
    roomProfilesResult,
  ] = await Promise.all([
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
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", currentUserId)
      .maybeSingle(),
    supabase
      .from("room_profiles")
      .select("display_name, avatar_url")
      .eq("room_id", roomId)
      .eq("user_id", currentUserId)
      .maybeSingle(),
    supabase
      .from("room_profiles")
      .select("user_id, display_name")
      .eq("room_id", roomId),
  ]);

  const isOwner = memberRecordResult.data?.role === "owner";
  const memberships = membershipsResult.data ?? [];
  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );

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
    const roomProfile = roomProfiles.get(m.user_id);
    return {
      userId: m.user_id,
      displayName:
        roomProfile?.display_name ?? profile?.display_name ?? "ไม่พบชื่อสมาชิก",
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
    <div className={styles.stack}>
      <div className={styles.settingsGrid}>
        <section className={`${styles.panel} ${styles.profilePanel}`}>
        <h2 className={styles.title}>โปรไฟล์ของฉันในห้องนี้</h2>
        <p className={styles.lead}>
          ตั้งชื่อเล่นหรือรูปที่ใช้เฉพาะห้องนี้ โดยไม่กระทบโปรไฟล์หลัก
        </p>
        <RoomProfileForm
          defaultValues={{
            avatarUrl: roomProfileResult.data?.avatar_url ?? null,
            displayName: roomProfileResult.data?.display_name ?? null,
          }}
          mainDisplayName={profileResult.data?.display_name ?? "โปรไฟล์หลัก"}
          roomCode={roomCode}
          roomId={roomId}
        />
        </section>

        <div className={styles.sideColumn}>
          <section className={styles.panel}>
        <h2 className={styles.title}>รหัสเข้าห้อง</h2>
        <p className={styles.lead}>
          ส่งรหัสห้องให้คนสำคัญ เพื่อเข้ามาอยู่ด้วยกัน
        </p>
        <div className={styles.codeRow}>
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
          <section className={styles.panel}>
            <h2 className={styles.title}>คำเชิญชั่วคราว</h2>
            <p className={styles.lead}>
              สร้างลิงก์ที่กำหนดวันหมดอายุ หรือจำกัดจำนวนครั้งได้
            </p>
            <CreateInviteForm roomCode={roomCode} roomId={roomId} />
            <div className={styles.inviteList}>
              <h3 className={styles.subTitle}>
                ที่สร้างไว้แล้ว ({invites.length})
              </h3>
              <InviteList
                invites={invites}
                roomCode={roomCode}
                roomId={roomId}
              />
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.title}>ดูแลสมาชิกในห้อง</h2>
            <p className={styles.lead}>
              เปลี่ยนบทบาท หรือนำคนออกจากห้องถ้าจำเป็น
            </p>
            <MemberManagement
              currentUserId={currentUserId}
              members={members}
              roomCode={roomCode}
              roomId={roomId}
            />
          </section>
        </>
      ) : (
        <section className={styles.panel}>
          <h2 className={styles.title}>เชิญเพื่อนเข้าห้อง</h2>
          <p className={styles.lead}>
            ส่งรหัสห้องด้านบนให้เพื่อนได้เลย — การสร้างลิงก์เชิญและจัดการบทบาท
            เป็นของเจ้าของห้อง
          </p>
        </section>
      )}

      <section className={`${styles.panel} ${styles.danger}`}>
        <h2 className={styles.title}>ออกจากห้อง</h2>
        <p className={styles.lead}>ออกแล้วจะเข้าอีกครั้งได้ด้วยรหัสหรือคำเชิญ</p>
        <LeaveRoomButton roomId={roomId} />
      </section>
        </div>
      </div>
    </div>
  );
}
