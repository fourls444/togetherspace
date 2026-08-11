import styles from "@/app/(app)/rooms/[roomId]/members/members.module.css";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

export default async function RoomMembersPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.panel}>
        <ErrorState
          description="ถ้าต้องการดูสมาชิกในห้องนี้ กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  const { currentUserId, roomCode, roomId, supabase } = context;

  const [membershipsResult, meResult, roomProfilesResult] = await Promise.all([
    supabase
      .from("room_members")
      .select(
        "user_id, role, joined_at, profiles(username, display_name, avatar_url)",
      )
      .eq("room_id", roomId)
      .order("joined_at"),
    supabase
      .from("room_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", currentUserId)
      .maybeSingle(),
    supabase
      .from("room_profiles")
      .select("user_id, display_name, avatar_url")
      .eq("room_id", roomId),
  ]);

  const memberships = membershipsResult.data ?? [];
  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );
  const isOwner = meResult.data?.role === "owner";
  const members: MemberListItem[] = memberships.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const roomProfile = roomProfiles.get(m.user_id);
    return {
      avatarUrl: roomProfile?.avatar_url ?? profile?.avatar_url ?? null,
      userId: m.user_id,
      displayName:
        roomProfile?.display_name ?? profile?.display_name ?? "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      role: m.role,
    };
  });

  return (
    <section className={styles.panel} aria-label="สมาชิกในห้อง">
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>สมาชิกในห้อง</h2>
          <p className={styles.meta}>{members.length} คน</p>
        </div>
        {isOwner ? (
          <ButtonLink href={getRoomSubPath(roomCode, "settings")}>
            แชร์ห้อง / เชิญเพื่อน
          </ButtonLink>
        ) : null}
      </div>
      <MemberList members={members} />
    </section>
  );
}
