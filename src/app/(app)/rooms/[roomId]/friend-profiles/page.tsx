import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "./friend-profiles.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { GlowCard } from "@/components/ui/glow-card";
import { sortRoomMembers } from "@/lib/rooms/member-sort";
import { getRoomContext } from "@/lib/rooms/server";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

/** หน้าโปรไฟล์รวมของสมาชิกในห้องเพื่อน ใช้ข้อมูลห้องที่มีอยู่ก่อน แล้วค่อยเพิ่มรายละเอียดภายหลัง */
export default async function FriendProfilesPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.pageMessage}>
        <ErrorState
          description="ถ้าต้องการดูโปรไฟล์เพื่อน กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  if (context.room.type !== "friend") {
    redirect(`/rooms/${context.roomCode}/members`);
  }

  const [membershipsResult, roomProfilesResult] = await Promise.all([
    context.supabase
      .from("room_members")
      .select("user_id, role, joined_at, profiles(username, display_name, avatar_url)")
      .eq("room_id", context.roomId)
      .order("joined_at"),
    context.supabase
      .from("room_profiles")
      .select("user_id, display_name, avatar_url")
      .eq("room_id", context.roomId),
  ]);

  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );
  const members = sortRoomMembers(
    (membershipsResult.data ?? []).map((membership) => {
      const profile = Array.isArray(membership.profiles)
        ? membership.profiles[0]
        : membership.profiles;
      const roomProfile = roomProfiles.get(membership.user_id);

      return {
        avatarUrl: roomProfile?.avatar_url ?? profile?.avatar_url ?? null,
        displayName:
          roomProfile?.display_name ?? profile?.display_name ?? "ไม่พบชื่อสมาชิก",
        role: membership.role,
        userId: membership.user_id,
        username: profile?.username ?? "unknown",
      };
    }),
    context.currentUserId,
  );

  return (
    <GlowCard
      aria-label="โปรไฟล์เพื่อน"
      contentClassName={styles.panel}
      role="region"
      roomType="friend"
      tone="room"
    >
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>พื้นที่แนะนำตัว</p>
          <h1 className={styles.title}>โปรไฟล์เพื่อน</h1>
          <p className={styles.meta}>ทำความรู้จักคนในห้องนี้ได้ในที่เดียว</p>
        </div>
        <span className={styles.count}>{members.length} คน</span>
      </div>

      {members.length > 0 ? (
        <ul className={styles.grid}>
          {members.map((member) => (
            <li key={member.userId}>
              <Link
                className={styles.card}
                href={`${getRoomSubPath(context.roomCode, "friend-profiles")}/${member.userId}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className={styles.avatar}
                  src={member.avatarUrl || getDefaultImageUrl("profile")}
                />
                <div className={styles.cardCopy}>
                  <h2>{member.displayName}</h2>
                  <p>@{member.username}</p>
                  <span>{member.role === "owner" ? "เจ้าของห้อง" : "สมาชิก"}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p>ยังไม่มีโปรไฟล์เพื่อนให้แสดง</p>
          <span>เมื่อมีสมาชิกเข้าห้อง รายชื่อจะแสดงที่นี่</span>
        </div>
      )}
    </GlowCard>
  );
}
