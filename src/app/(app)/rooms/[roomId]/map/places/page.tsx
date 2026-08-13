import { PlaceList } from "@/components/places/place-list";
import type { PlaceMapItem } from "@/components/places/place-map";
import styles from "@/components/places/place-map.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomContext } from "@/lib/rooms/server";

export default async function RoomPlacesPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
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
    .select("id, name, description, latitude, longitude, place_date, created_at")
    .eq("room_id", context.roomId)
    .order("created_at", { ascending: false });

  const places: PlaceMapItem[] = (placesResult.data ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    placeDate: place.place_date,
  }));

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>สถานที่ทั้งหมด</p>
          <h1 className={styles.title}>รายชื่อสถานที่</h1>
          <p className={styles.description}>
            สถานที่ทั้งหมดที่ถูกปักหมุดไว้ในห้องนี้
            คลิกที่สถานที่เพื่อดูบนแผนที่หรือแก้ไขรายละเอียด
          </p>
        </div>
      </section>

      <div className={styles.listPageContainer}>
        <div className={styles.listPageHeader}>
          <h2>สถานที่ ปักหมุดทั้งหมด {places.length} สถานที่</h2>
          <ButtonLink href={`/rooms/${context.roomCode}/map`} variant="default">
            📍 กลับไปหน้าแผนที่
          </ButtonLink>
        </div>
        
        <div className={styles.listPageContent}>
          <PlaceList
            places={places}
            roomCode={context.roomCode}
            roomId={context.roomId}
            searchable
          />
        </div>
      </div>
    </div>
  );
}
