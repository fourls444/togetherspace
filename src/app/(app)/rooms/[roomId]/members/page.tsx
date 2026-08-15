import styles from "@/app/(app)/rooms/[roomId]/members/members.module.css";
import {
  MemberManagement,
  type ManageMemberItem,
} from "@/components/rooms/member-management";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { FriendMemberProfiles } from "@/components/rooms/friend-member-profiles";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { GlowCard } from "@/components/ui/glow-card";
import { sortRoomMembers } from "@/lib/rooms/member-sort";
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

  const { currentUserId, room, roomCode, roomId, supabase } = context;

  const [membershipsResult, meResult, roomProfilesResult, friendProfilesResult] = await Promise.all([
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
    room.type === "friend"
      ? supabase
          .from("friend_profiles")
          .select("user_id, bio, facebook_url, line_id, instagram_url, phone")
          .eq("room_id", roomId)
      : Promise.resolve({ data: [] as { user_id: string; bio: string | null; facebook_url: string | null; line_id: string | null; instagram_url: string | null; phone: string | null }[] }),
  ]);

  const memberships = membershipsResult.data ?? [];
  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );
  const isOwner = meResult.data?.role === "owner";
  const members: MemberListItem[] = sortRoomMembers(memberships.map((m) => {
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
  }), currentUserId);

  return (
    <GlowCard
      aria-label="สมาชิก"
      contentClassName={styles.panel}
      role="region"
      roomType={room.type}
      tone="room"
    >
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>สมาชิก</h2>
          <p className={styles.meta}>{members.length} คน</p>
        </div>
      </div>
      {room.type === "friend" ? (
        <FriendMemberProfiles
          canManage={isOwner}
          currentUserId={currentUserId}
          members={members}
          profiles={friendProfilesResult.data ?? []}
          roomCode={roomCode}
          roomId={roomId}
        />
      ) : isOwner ? (
        <MemberManagement
          currentUserId={currentUserId}
          members={members as ManageMemberItem[]}
          roomCode={roomCode}
          roomId={roomId}
        />
      ) : (
        <MemberList members={members} />
      )}
    </GlowCard>
  );
}
