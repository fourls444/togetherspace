import Link from "next/link";

import styles from "@/components/rooms/room-home.module.css";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomHomeModules } from "@/lib/rooms/labels";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

/** หน้าแรกของห้อง แสดงทางลัดโมดูลหลักและสมาชิกในห้อง */
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
        <ButtonLink href="/dashboard">กลับหน้าหลัก</ButtonLink>
      </div>
    );
  }

  const { room, roomCode, roomId, supabase } = context;
  const [membershipsResult, roomProfilesResult] = await Promise.all([
    supabase
      .from("room_members")
      .select(
        "user_id, role, joined_at, profiles(username, display_name, avatar_url)",
      )
      .eq("room_id", roomId)
      .order("joined_at"),
    supabase
      .from("room_profiles")
      .select("user_id, display_name, avatar_url")
      .eq("room_id", roomId),
  ]);

  if (membershipsResult.error) {
    return (
      <div className={styles.panel}>
        <ErrorState
          description="ลองรีเฟรชหน้าอีกครั้ง ถ้ายังไม่ได้ให้ตรวจการเชื่อมต่อกับ Supabase"
          headingLevel={1}
          title="โหลดข้อมูลสมาชิกไม่สำเร็จ"
        />
      </div>
    );
  }

  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );
  const members: MemberListItem[] = (membershipsResult.data ?? []).map(
    (membership) => {
      const profile = Array.isArray(membership.profiles)
        ? membership.profiles[0]
        : membership.profiles;
      const roomProfile = roomProfiles.get(membership.user_id);

      return {
        avatarUrl: roomProfile?.avatar_url ?? profile?.avatar_url ?? null,
        displayName:
          roomProfile?.display_name ??
          profile?.display_name ??
          "ไม่พบชื่อสมาชิก",
        role: membership.role,
        userId: membership.user_id,
        username: profile?.username ?? "unknown",
      };
    },
  );
  const previewMembers = members.slice(0, 4);
  const modules = getRoomHomeModules(room.type).filter((module) =>
    ["calendar", "map", "album", "board", "finance"].includes(module.key),
  );

  return (
    <div className={styles.stack}>
      <section className={styles.modulePanel} aria-label="พื้นที่ในห้อง">
        <div className={styles.modulePanelHead}>
          <div>
            <p className={styles.kicker}>พื้นที่ในห้อง</p>
            <h2 className={styles.blockTitle}>เลือกสิ่งที่อยากทำต่อ</h2>
          </div>
        </div>
        <div className={styles.moduleGrid}>
          {modules.map((module) => (
            <Link
              className={styles.moduleCard}
              href={getRoomSubPath(roomCode, module.href)}
              key={module.key}
              prefetch
            >
              <span className={styles.moduleBadge}>{module.key}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.presence} aria-label="สมาชิกในห้อง">
        <div className={styles.presenceHead}>
          <div>
            <p className={styles.kicker}>สมาชิก</p>
            <h2 className={styles.blockTitle}>สมาชิกในห้อง</h2>
          </div>
          <p className={styles.presenceMeta}>{members.length} คน</p>
        </div>
        <div className={styles.memberFrame}>
          {previewMembers.length > 0 ? (
            <MemberList members={previewMembers} />
          ) : (
            <p className={styles.emptyText}>ยังไม่มีรายชื่อสมาชิกให้แสดง</p>
          )}
        </div>
        <div className={styles.presenceActions}>
          <ButtonLink href={getRoomSubPath(roomCode, "members")}>
            ดูสมาชิกทั้งหมด
          </ButtonLink>
          <ButtonLink href={getRoomSubPath(roomCode, "settings")}>
            ตั้งค่าห้อง
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
