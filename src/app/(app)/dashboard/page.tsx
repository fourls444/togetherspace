import styles from "@/app/(app)/dashboard/dashboard.module.css";
import { DashboardHero } from "@/app/(app)/dashboard/dashboard-hero";
import { LivingStage } from "@/components/effects/living-stage";
import { RoomCard } from "@/components/rooms/room-card";
import { GlowCard } from "@/components/ui/glow-card";
import { SpecularCtaLink } from "@/components/ui/specular-cta";
import { ErrorState } from "@/components/ui/error-state";
import type { RoomRole } from "@/lib/types/database";
import { requireAppUser } from "@/lib/rooms/sidebar";

export default async function DashboardPage() {
  const { supabase, userId } = await requireAppUser();

  const [profileResult, roomsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("rooms")
      .select(
        "id, name, type, avatar_url, room_code, created_at, room_members!inner(role, joined_at)",
      )
      .eq("room_members.user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const hasLoadError = Boolean(profileResult.error || roomsResult.error);
  const userRooms = roomsResult.data ?? [];
  const displayName =
    profileResult.data?.display_name ??
    profileResult.data?.username ??
    "คุณ";

  const roomIds = userRooms.map((room) => room.id);
  const memberCountsResult =
    roomIds.length > 0
      ? await supabase.from("room_members").select("room_id").in("room_id", roomIds)
      : { data: [] as { room_id: string }[], error: null };

  const memberCountByRoom = new Map<string, number>();
  for (const row of memberCountsResult.data ?? []) {
    memberCountByRoom.set(
      row.room_id,
      (memberCountByRoom.get(row.room_id) ?? 0) + 1,
    );
  }

  return (
    <main className={styles.hub}>
      <DashboardHero displayName={displayName} />

      {hasLoadError ? (
        <ErrorState
          description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
          title="โหลดห้องไม่สำเร็จ"
        />
      ) : userRooms.length ? (
        <section className={styles.section} aria-label="ห้องของคุณ">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>ห้องที่มีอยู่</h2>
            <p className={styles.sectionHint}>{userRooms.length} ห้อง</p>
          </div>
          <LivingStage className={styles.roomGrid}>
            {userRooms.map((room) => {
              const membership = Array.isArray(room.room_members)
                ? room.room_members[0]
                : room.room_members;
              const role = (membership?.role ?? "member") as RoomRole;
              return (
                <RoomCard
                  key={room.id}
                  memberCount={memberCountByRoom.get(room.id) ?? 1}
                  role={role}
                  room={room}
                />
              );
            })}
          </LivingStage>
        </section>
      ) : (
        <GlowCard
          animated
          aria-label="ยังไม่มีห้อง"
          className={styles.emptyShell}
          contentClassName={styles.empty}
          tone="room"
        >
          <h2 className={styles.emptyTitle}>ยังไม่มีห้องเลย</h2>
          <p className={styles.emptyText}>
            เริ่มจากสร้างห้องแรก หรือใช้รหัสที่คนสำคัญส่งมาให้
          </p>
          <div className={styles.emptyActions}>
            <SpecularCtaLink href="/dashboard/create-room">
              สร้างห้องแรก
            </SpecularCtaLink>
            <SpecularCtaLink href="/dashboard/join-room" tone="secondary">
              มีรหัสอยู่แล้ว
            </SpecularCtaLink>
          </div>
        </GlowCard>
      )}
    </main>
  );
}
