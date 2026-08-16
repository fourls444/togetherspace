import { PlaceMapWorkspace } from "@/components/places/place-map-workspace";
import styles from "@/components/places/place-map.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { attachPlaceCreators } from "@/lib/places/attach-place-creators";
import { getRoomContext } from "@/lib/rooms/server";

/** หน้าแผนที่ของห้อง แสดงสถานที่ที่สมาชิกบันทึกร่วมกัน */
export default async function RoomMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ placeId?: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const { placeId } = await searchParams;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.sidePanel}>
        <ErrorState
          description="ถ้าต้องการดูแผนที่นี้ กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าหลัก</ButtonLink>
      </div>
    );
  }

  const placesResult = await context.supabase
    .from("room_places")
    .select(
      "id, name, description, latitude, longitude, place_date, created_by",
    )
    .eq("room_id", context.roomId)
    .order("created_at", { ascending: false });

  const placeRows = placesResult.data ?? [];
  const creatorIds = [
    ...new Set(placeRows.map((place) => place.created_by)),
  ];

  const [profilesResult, roomProfilesResult] =
    creatorIds.length > 0
      ? await Promise.all([
          context.supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", creatorIds),
          context.supabase
            .from("room_profiles")
            .select("user_id, display_name, avatar_url")
            .eq("room_id", context.roomId)
            .in("user_id", creatorIds),
        ])
      : [
          { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] },
          {
            data: [] as {
              user_id: string;
              display_name: string | null;
              avatar_url: string | null;
            }[],
          },
        ];

  const places = attachPlaceCreators(
    placeRows,
    profilesResult.data ?? [],
    roomProfilesResult.data ?? [],
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.title}>สถานที่ที่อยากจำไว้ด้วยกัน</h1>
          <p className={styles.description}>
            ดูเมืองที่มีความทรงจำ แล้วซูมเข้าแผนที่ถนนเมื่อจะปักหมุดใหม่
          </p>
        </div>
      </section>

      <PlaceMapWorkspace
        initialFlyToPlaceId={placeId}
        places={places}
        roomCode={context.roomCode}
        roomId={context.roomId}
      />
    </div>
  );
}
