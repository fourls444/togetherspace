import styles from "@/app/(app)/dashboard/dashboard.module.css";
import { LogoutForm } from "@/components/auth/logout-form";
import { RoomCard } from "@/components/rooms/room-card";
import { ButtonLink } from "@/components/ui/button-link";
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
    "ผู้ใช้";

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>ห้องของคุณ</h1>
          <p className={styles.profileName}>สวัสดี {displayName}</p>
        </div>
        <div className={styles.actions}>
          <ButtonLink href="/dashboard/create-room" variant="primary">
            สร้างห้อง
          </ButtonLink>
          <ButtonLink href="/dashboard/join-room">เข้าร่วม</ButtonLink>
          <div className={styles.secondaryActions}>
            <ButtonLink href="/profile">โปรไฟล์</ButtonLink>
            <LogoutForm />
          </div>
        </div>
      </header>

      {hasLoadError ? (
        <ErrorState
          description="กรุณารีเฟรชหน้าและลองอีกครั้ง"
          title="โหลดข้อมูลห้องไม่สำเร็จ"
        />
      ) : userRooms.length ? (
        <section aria-label="รายการห้อง" className={styles.roomsGrid}>
          {userRooms.map((room) => {
            const membership = Array.isArray(room.room_members)
              ? room.room_members[0]
              : room.room_members;
            const role = (membership?.role ?? "member") as RoomRole;

            return (
              <RoomCard key={room.id} role={role} room={room} />
            );
          })}
        </section>
      ) : (
        <section aria-label="ยังไม่มีห้อง" className={styles.empty}>
          <h2 className={styles.emptyTitle}>ยังไม่มีห้อง</h2>
          <p className={styles.emptyDescription}>
            สร้างห้องแรกของคุณ หรือเข้าร่วมห้องด้วยรหัสคำเชิญ
          </p>
          <div className={styles.emptyActions}>
            <ButtonLink href="/dashboard/create-room" variant="primary">
              สร้างห้องใหม่
            </ButtonLink>
            <ButtonLink href="/dashboard/join-room">
              เข้าร่วมห้องด้วยรหัส
            </ButtonLink>
          </div>
        </section>
      )}
    </main>
  );
}
