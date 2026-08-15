import {
  FamilyTreeClient,
  type FamilyTreeMemberOption,
  type FamilyTreePersonView,
  type FamilyTreeRelationshipView,
} from "@/app/(app)/rooms/[roomId]/family-tree/family-tree-client";
import styles from "@/app/(app)/rooms/[roomId]/family-tree/family-tree.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { GlowCard } from "@/components/ui/glow-card";
import { sortRoomMembers } from "@/lib/rooms/member-sort";
import { getRoomContext } from "@/lib/rooms/server";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

/** หน้า Family Tree หลัก ใช้ได้เฉพาะห้องประเภทครอบครัว */
export default async function FamilyTreePage({
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
          description="เข้าร่วมห้องก่อนจึงจะดูผังครอบครัวได้"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าหลัก</ButtonLink>
      </div>
    );
  }

  const { room, roomCode, roomId, supabase } = context;

  if (room.type !== "family") {
    return (
      <div className={styles.stack}>
        <ErrorState
          description="หน้านี้ออกแบบมาสำหรับห้องประเภทครอบครัวเท่านั้น"
          headingLevel={1}
          title="ผังครอบครัวใช้ได้เฉพาะห้องครอบครัว"
        />
        <ButtonLink href={`/rooms/${roomCode}`}>กลับหน้าหลัก</ButtonLink>
      </div>
    );
  }

  const [membersResult, roomProfilesResult, peopleResult, relationshipsResult] =
    await Promise.all([
      supabase
        .from("room_members")
        .select("user_id, role, profiles(username, display_name, avatar_url)")
        .eq("room_id", roomId)
        .order("joined_at"),
      supabase
        .from("room_profiles")
        .select("user_id, display_name, avatar_url")
        .eq("room_id", roomId),
      supabase
        .from("family_tree_people")
        .select(
          "id, room_member_user_id, display_name, role, avatar_url, position_x, position_y",
        )
        .eq("room_id", roomId)
        .order("created_at"),
      supabase
        .from("family_tree_relationships")
        .select("id, from_person_id, to_person_id, relationship_type")
        .eq("room_id", roomId)
        .order("created_at"),
    ]);

  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );

  const members: FamilyTreeMemberOption[] = sortRoomMembers(
    (membersResult.data ?? []).map((member) => {
      const profile = Array.isArray(member.profiles)
        ? member.profiles[0]
        : member.profiles;
      const roomProfile = roomProfiles.get(member.user_id);

      return {
        avatarUrl:
          roomProfile?.avatar_url ??
          profile?.avatar_url ??
          getDefaultImageUrl("profile"),
        displayName:
          roomProfile?.display_name ??
          profile?.display_name ??
          profile?.username ??
          "สมาชิก",
        role: member.role,
        userId: member.user_id,
        username: profile?.username ?? "member",
      };
    }),
    context.currentUserId,
  ).map((member) => ({
    avatarUrl: member.avatarUrl,
    displayName: member.displayName,
    userId: member.userId,
    username: member.username,
  }));

  const memberById = new Map(members.map((member) => [member.userId, member]));

  const people: FamilyTreePersonView[] = (peopleResult.data ?? []).map(
    (person) => {
      const linkedMember = person.room_member_user_id
        ? memberById.get(person.room_member_user_id)
        : null;

      return {
        avatarUrl:
          person.avatar_url ??
          linkedMember?.avatarUrl ??
          getDefaultImageUrl("profile"),
        displayName: person.display_name,
        id: person.id,
        positionX: person.position_x,
        positionY: person.position_y,
        role: person.role,
        roomMemberUserId: person.room_member_user_id,
      };
    },
  );

  const relationships: FamilyTreeRelationshipView[] = (
    relationshipsResult.data ?? []
  ).map((relationship) => ({
    fromPersonId: relationship.from_person_id,
    id: relationship.id,
    relationshipType: relationship.relationship_type,
    toPersonId: relationship.to_person_id,
  }));

  return (
    <div className={styles.stack}>
      <GlowCard contentClassName={styles.hero} roomType="family" tone="room">
        <div>
          <p className={styles.kicker}>Family Tree</p>
          <h1 className={styles.title}>ผังครอบครัว</h1>
          <p className={styles.lead}>
            เพิ่มสมาชิกจริงหรือ guest แล้วจัดตำแหน่งเองได้ในผังเดียวของห้องนี้
          </p>
        </div>
      </GlowCard>
      <FamilyTreeClient
        initialPeople={people}
        initialRelationships={relationships}
        members={members}
        roomCode={roomCode}
        roomId={roomId}
      />
    </div>
  );
}
