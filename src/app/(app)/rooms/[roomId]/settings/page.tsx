import styles from "@/app/(app)/rooms/[roomId]/settings/settings.module.css";
import { CreateInviteForm } from "@/components/rooms/create-invite-form";
import {
  InviteList,
  type InviteListItem,
} from "@/components/rooms/invite-list";
import { LeaveRoomButton } from "@/components/rooms/leave-room-button";
import { RoomDetailsForm } from "@/components/rooms/room-details-form";
import { RoomProfileForm } from "@/components/rooms/room-profile-form";
import { RoomThemeSelector } from "@/components/rooms/room-theme-selector";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { GlowCard } from "@/components/ui/glow-card";
import { getRoomContext } from "@/lib/rooms/server";

/** แสดงการตั้งค่าห้องตามลำดับการใช้งานในคอลัมน์เดียว */
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
          description="หากต้องการดูแลห้องนี้ กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  const { currentUserId, room, roomCode, roomId, supabase } = context;

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
      .select("user_id, display_name, avatar_url")
      .eq("room_id", roomId),
  ]);

  const isOwner = memberRecordResult.data?.role === "owner";
  const memberships = membershipsResult.data ?? [];
  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [
      profile.user_id,
      profile,
    ]),
  );

  const invitesResult = isOwner
    ? await supabase
        .from("room_invites")
        .select(
          "id, invite_code, invite_token, created_by, uses_count, max_uses, expires_at, created_at, revoked_at",
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
    : { data: [] as never[] };

  const inviteRows = invitesResult.data ?? [];
  const creatorIds = [
    ...new Set(inviteRows.map((invite) => invite.created_by)),
  ];
  const inviteCreatorsResult = creatorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", creatorIds)
    : { data: [] as { id: string; display_name: string; username: string }[] };

  const members = memberships.map((membership) => {
    const profile = Array.isArray(membership.profiles)
      ? membership.profiles[0]
      : membership.profiles;
    const roomProfile = roomProfiles.get(membership.user_id);

    return {
      userId: membership.user_id,
      displayName:
        roomProfile?.display_name ?? profile?.display_name ?? "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      avatarUrl: roomProfile?.avatar_url ?? profile?.avatar_url ?? null,
      role: membership.role,
    };
  });

  const memberNames = new Map(
    members.map((member) => [member.userId, member.displayName]),
  );
  const creatorNames = new Map(
    (inviteCreatorsResult.data ?? []).map((profile) => [
      profile.id,
      profile.display_name || `@${profile.username}`,
    ]),
  );
  const invites: InviteListItem[] = inviteRows.map((invite) => ({
    id: invite.id,
    inviteCode: invite.invite_code,
    inviteToken: invite.invite_token,
    usesCount: invite.uses_count,
    maxUses: invite.max_uses,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
    revokedAt: invite.revoked_at,
    createdByName:
      memberNames.get(invite.created_by) ??
      creatorNames.get(invite.created_by) ??
      "ไม่พบชื่อผู้สร้าง",
  }));

  return (
    <div className={styles.stack}>
      <header className={styles.pageHead}>
        <h2 className={styles.pageTitle}>ตั้งค่าห้อง</h2>
        <p className={styles.pageLead}>
          โปรไฟล์ในห้อง คำเชิญ และการดูแลสมาชิก
        </p>
      </header>

      <div className={`${styles.primaryGrid} ${isOwner ? "" : styles.single}`}>
        <GlowCard
          contentClassName={`${styles.panel} ${styles.profilePanel}`}
          roomType={room.type}
          tone="room"
        >
          <h3 className={styles.title}>โปรไฟล์ของฉันในห้องนี้</h3>
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
        </GlowCard>

        {isOwner ? (
          <GlowCard contentClassName={styles.panel} roomType={room.type} tone="room">
            <h3 className={styles.title}>ข้อมูลห้อง</h3>
            <p className={styles.lead}>
              แก้ชื่อและรูปที่สมาชิกทุกคนเห็นร่วมกัน
            </p>
            <RoomDetailsForm
              avatarUrl={room.avatar_url}
              name={room.name}
              roomCode={roomCode}
              roomId={roomId}
              roomType={room.type}
            />

            <div className={styles.sectionDivider} id="invite">
              <h3 className={styles.subTitle}>สร้างคำเชิญชั่วคราว</h3>
              <p className={styles.lead}>
                สร้างลิงก์ที่จำกัดจำนวนการใช้หรือกำหนดวันหมดอายุได้
              </p>
              <CreateInviteForm roomCode={roomCode} roomId={roomId} />

              <details className={styles.inviteHistory}>
                <summary>ดูคำเชิญที่สร้างไว้ ({invites.length})</summary>
                <InviteList
                  invites={invites}
                  roomCode={roomCode}
                  roomId={roomId}
                />
              </details>
            </div>
          </GlowCard>
        ) : null}
      </div>

      <GlowCard contentClassName={styles.panel} roomType={room.type} tone="room">
        <h3 className={styles.title}>ธีมห้อง</h3>
        <p className={styles.lead}>
          เลือกบรรยากาศที่เหมาะกับห้องนี้ โดยธีม TogetherSpace จะเป็นค่าเริ่มต้นเสมอ
        </p>
        <RoomThemeSelector />
      </GlowCard>

      <GlowCard contentClassName={styles.panel} tone="danger">
        <h3 className={styles.title}>ออกจากห้อง</h3>
        <p className={styles.lead}>
          หลังออกจากห้อง คุณจะกลับเข้ามาได้อีกด้วยรหัสห้องหรือคำเชิญ
        </p>
        <LeaveRoomButton roomId={roomId} />
      </GlowCard>
    </div>
  );
}
