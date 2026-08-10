import styles from "@/app/(app)/dashboard/dashboard.module.css";
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
    "คุณ";

  return (
    <main className={styles.hub}>
      <section className={styles.hero} aria-label="ยินดีต้อนรับ">
        <p className={styles.greeting}>สวัสดี {displayName}</p>
        <h1 className={styles.title}>ห้องหลังค่ำของคุณ</h1>
        <p className={styles.lead}>
          พื้นที่เงียบสงบสำหรับเพื่อน คู่รัก หรือครอบครัว
          เข้าไปในห้อง หรือชวนคนสำคัญมาอยู่ด้วยกัน
        </p>
        <div className={styles.heroActions}>
          <ButtonLink href="/dashboard/create-room" variant="primary">
            สร้างห้องใหม่
          </ButtonLink>
          <ButtonLink href="/dashboard/join-room">เข้าร่วมด้วยรหัส</ButtonLink>
        </div>
      </section>

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
          <div className={styles.roomGrid}>
            {userRooms.map((room) => {
              const membership = Array.isArray(room.room_members)
                ? room.room_members[0]
                : room.room_members;
              const role = (membership?.role ?? "member") as RoomRole;
              return <RoomCard key={room.id} role={role} room={room} />;
            })}
          </div>
        </section>
      ) : (
        <section className={styles.empty} aria-label="ยังไม่มีห้อง">
          <h2 className={styles.emptyTitle}>ยังไม่มีห้องเลย</h2>
          <p className={styles.emptyText}>
            เริ่มจากสร้างห้องแรก หรือใช้รหัสที่คนสำคัญส่งมาให้
          </p>
          <div className={styles.emptyActions}>
            <ButtonLink href="/dashboard/create-room" variant="primary">
              สร้างห้องแรก
            </ButtonLink>
            <ButtonLink href="/dashboard/join-room">มีรหัสอยู่แล้ว</ButtonLink>
          </div>
        </section>
      )}
    </main>
  );
}
