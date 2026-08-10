import styles from "@/app/rooms/[roomId]/room-detail.module.css";
import { PageShell } from "@/components/layout/page-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Panel } from "@/components/ui/panel";
import { getRoomContext } from "@/lib/rooms/server";
import { getRoomSubPath } from "@/lib/rooms/room-path";

export const dynamic = "force-dynamic";

/** แสดงหน้าห้องโดยใช้ room code บน URL และกันคนที่ไม่ใช่สมาชิกออกจากห้อง */
export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.container}>
        <Sidebar rooms={context.sidebarRooms} />
        <PageShell>
          <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>
          <div className={styles.error}>
            <ErrorState
              description="ถ้าต้องการเข้าห้องนี้ กรุณาใช้รหัสเข้าร่วมหรือขอลิงก์เชิญจากเจ้าของห้อง"
              headingLevel={1}
              title="คุณไม่ได้อยู่ในห้องนี้"
            />
          </div>
        </PageShell>
      </div>
    );
  }

  const { currentUserId, room, roomCode, roomId, sidebarRooms, supabase } =
    context;

  const membershipsResult = await supabase
    .from("room_members")
    .select("user_id, role, joined_at")
    .eq("room_id", roomId)
    .order("joined_at");

  const memberships = membershipsResult.data ?? [];
  const userIds = memberships.map((membership) => membership.user_id);
  const currentMember = memberships.find((m) => m.user_id === currentUserId);
  const isOwner = currentMember?.role === "owner";

  const profilesResult = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds)
    : { data: [], error: null };

  if (membershipsResult.error || profilesResult.error) {
    return (
      <div className={styles.container}>
        <Sidebar rooms={sidebarRooms} />
        <PageShell>
          <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>
          <div className={styles.error}>
            <ErrorState
              description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
              headingLevel={1}
              title="โหลดรายชื่อสมาชิกไม่สำเร็จ"
            />
          </div>
        </PageShell>
      </div>
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
    <div className={styles.container}>
      <Sidebar rooms={sidebarRooms} />
      <PageShell>
        <ButtonLink href="/dashboard">กลับไปหน้าหลัก</ButtonLink>

        <Panel as="header" className={styles.headerPanel}>
          <div className={styles.headerContent}>
            <div>
              <p className={styles.eyebrow}>{room.type}</p>
              <h1 className={styles.title}>{room.name}</h1>
            </div>
            <div className={styles.roomActions}>
              <Badge>{memberships.length} สมาชิก</Badge>
              <ButtonLink href={getRoomSubPath(roomCode, "members")}>
                สมาชิก ({memberships.length})
              </ButtonLink>
              <ButtonLink href={getRoomSubPath(roomCode, "board")}>
                บอร์ด
              </ButtonLink>
              {isOwner ? (
                <ButtonLink
                  href={getRoomSubPath(roomCode, "settings")}
                  variant="primary"
                >
                  ตั้งค่าห้อง
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel className={styles.membersPanel}>
          <div className={styles.membersHeader}>
            <h2 className={styles.membersTitle}>สมาชิกในห้อง</h2>
            <ButtonLink href={getRoomSubPath(roomCode, "members")}>
              ดูสมาชิกทั้งหมด
            </ButtonLink>
          </div>
          <MemberList members={members} />
        </Panel>
      </PageShell>
    </div>
  );
}
