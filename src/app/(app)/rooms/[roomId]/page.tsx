import Link from "next/link";

import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import styles from "@/components/rooms/room-home.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomHomeModules } from "@/lib/rooms/labels";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

/** หน้าห้อง — คนที่อยู่ + ทางเข้าบอร์ดชัดๆ (แท็บด้านบนมีทางอื่นอยู่แล้ว) */
export default async function RoomPage({
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
          description="ถ้าต้องการเข้าห้องนี้ กรุณาใช้รหัสเข้าร่วมหรือขอลิงก์เชิญจากเจ้าของห้อง"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  const { currentUserId, room, roomCode, roomId, supabase } = context;

  const membershipsResult = await supabase
    .from("room_members")
    .select(
      "user_id, role, joined_at, profiles(username, display_name, avatar_url)",
    )
    .eq("room_id", roomId)
    .order("joined_at");

  if (membershipsResult.error) {
    return (
      <ErrorState
        description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
        headingLevel={1}
        title="โหลดรายชื่อไม่สำเร็จ"
      />
    );
  }

  const memberships = membershipsResult.data ?? [];
  const currentMember = memberships.find((m) => m.user_id === currentUserId);
  const isOwner = currentMember?.role === "owner";

  const members: MemberListItem[] = memberships.map((membership) => {
    const profile = Array.isArray(membership.profiles)
      ? membership.profiles[0]
      : membership.profiles;
    return {
      userId: membership.user_id,
      displayName: profile?.display_name ?? "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      role: membership.role,
    };
  });
  const previewMembers = members.slice(0, 4);
  const boardModule =
    getRoomHomeModules(room.type).find((module) => module.key === "board") ??
    getRoomHomeModules(room.type)[0];

  return (
    <div className={styles.stack}>
      <Link
        className={styles.spotlight}
        href={getRoomSubPath(roomCode, boardModule.href)}
        prefetch
      >
        <p className={styles.spotlightKicker}>มุมหลักของห้อง</p>
        <h2 className={styles.spotlightTitle}>{boardModule.title}</h2>
        <p className={styles.spotlightText}>{boardModule.description}</p>
        <span className={styles.spotlightCta}>เปิดบอร์ด →</span>
      </Link>

      <section className={styles.presence} aria-label="คนในห้อง">
        <div className={styles.presenceHead}>
          <h2 className={styles.blockTitle}>ใครอยู่ในห้อง</h2>
          <p className={styles.blockMeta}>
            {memberships.length} คน · รหัส {roomCode}
          </p>
        </div>
        <MemberList members={previewMembers} />
        <div className={styles.presenceActions}>
          <ButtonLink href={getRoomSubPath(roomCode, "members")}>
            ดูทุกคน
          </ButtonLink>
          {isOwner ? (
            <ButtonLink href={getRoomSubPath(roomCode, "settings")}>
              เชิญคนเข้ามา
            </ButtonLink>
          ) : null}
        </div>
      </section>
    </div>
  );
}
