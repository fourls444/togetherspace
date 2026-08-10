import { redirect } from "next/navigation";

import styles from "@/app/dashboard/dashboard.module.css";
import { LogoutForm } from "@/components/auth/logout-form";
import { AppFrame } from "@/components/layout/app-frame";
import { RoomCard } from "@/components/rooms/room-card";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/login");

  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("room_members")
      .select("room_id, role, joined_at")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false }),
  ]);

  const memberships = membershipsResult.data ?? [];
  const roomIds = memberships.map((membership) => membership.room_id);
  const roomsResult = roomIds.length
    ? await supabase
        .from("rooms")
        .select("id, name, type, avatar_url, room_code, created_at")
        .in("id", roomIds)
    : { data: [], error: null };

  const hasLoadError = Boolean(
    profileResult.error || membershipsResult.error || roomsResult.error,
  );
  const membershipByRoom = new Map(
    memberships.map((membership) => [membership.room_id, membership]),
  );

  const userRooms = roomsResult.data ?? [];
  const displayName =
    profileResult.data?.display_name ??
    profileResult.data?.username ??
    "ผู้ใช้";

  return (
    <AppFrame rooms={userRooms}>
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
            {userRooms.map((room) => (
              <RoomCard
                key={room.id}
                role={membershipByRoom.get(room.id)?.role ?? "member"}
                room={room}
              />
            ))}
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
    </AppFrame>
  );
}
