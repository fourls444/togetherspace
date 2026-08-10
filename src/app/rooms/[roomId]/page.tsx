import Link from "next/link";

import styles from "@/app/rooms/[roomId]/room-detail.module.css";
import { AppFrame } from "@/components/layout/app-frame";
import { MemberList, type MemberListItem } from "@/components/rooms/member-list";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomHomeModules, ROOM_TYPE_LABEL } from "@/lib/rooms/labels";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";

export const dynamic = "force-dynamic";

function roomInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

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
      <AppFrame rooms={context.sidebarRooms}>
        <main className={styles.shell}>
          <Link className={styles.backLink} href="/dashboard">
            ← กลับไปหน้าหลัก
          </Link>
          <div className={styles.error}>
            <ErrorState
              description="ถ้าต้องการเข้าห้องนี้ กรุณาใช้รหัสเข้าร่วมหรือขอลิงก์เชิญจากเจ้าของห้อง"
              headingLevel={1}
              title="คุณไม่ได้อยู่ในห้องนี้"
            />
          </div>
        </main>
      </AppFrame>
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
      <AppFrame rooms={sidebarRooms}>
        <main className={styles.shell}>
          <Link className={styles.backLink} href="/dashboard">
            ← กลับไปหน้าหลัก
          </Link>
          <div className={styles.error}>
            <ErrorState
              description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
              headingLevel={1}
              title="โหลดรายชื่อสมาชิกไม่สำเร็จ"
            />
          </div>
        </main>
      </AppFrame>
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
  const previewMembers = members.slice(0, 4);

  const modules = getRoomHomeModules(room.type);
  const avatar = room.avatar_url?.trim();

  return (
    <AppFrame rooms={sidebarRooms}>
      <main className={styles.shell}>
        <div className={styles.topBar}>
          <Link className={styles.backLink} href="/dashboard">
            ← กลับไปหน้าหลัก
          </Link>
          <div className={styles.roomActions}>
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

        <header className={styles.hero}>
          <div className={styles.heroMain}>
            <div className={styles.heroAvatar} aria-hidden>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className={styles.heroImage} src={avatar} />
              ) : (
                <span className={styles.heroInitial}>
                  {roomInitial(room.name)}
                </span>
              )}
            </div>
            <div>
              <p className={styles.typeLabel}>{ROOM_TYPE_LABEL[room.type]}</p>
              <h1 className={styles.title}>{room.name}</h1>
              <p className={styles.heroMeta}>
                {memberships.length} สมาชิก · รหัสห้อง {roomCode}
              </p>
            </div>
          </div>
        </header>

        <section aria-label="เนื้อหาห้อง" className={styles.moduleGrid}>
          {modules.map((module) => (
            <Link
              className={styles.moduleCard}
              href={getRoomSubPath(roomCode, module.href)}
              key={module.key}
            >
              <h2 className={styles.moduleTitle}>{module.title}</h2>
              <p className={styles.moduleText}>{module.description}</p>
            </Link>
          ))}
        </section>

        <section className={styles.membersPanel} aria-label="สมาชิกในห้อง">
          <div className={styles.membersHeader}>
            <h2 className={styles.membersTitle}>
              คนในห้อง · {memberships.length}
            </h2>
            <ButtonLink href={getRoomSubPath(roomCode, "members")}>
              ดูทั้งหมด
            </ButtonLink>
          </div>
          <MemberList members={previewMembers} />
        </section>
      </main>
    </AppFrame>
  );
}
