import { PlaceMapWorkspace } from "@/components/places/place-map-workspace";
import type { PlaceMapItem } from "@/components/places/place-map";
import styles from "@/components/places/place-map.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomContext } from "@/lib/rooms/server";

const PLACE_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function formatPlaceDate(date: string | null) {
  if (!date) return null;
  return PLACE_DATE_FORMATTER.format(new Date(`${date}T00:00:00.000Z`));
}

/** หน้าแผนที่ของห้อง แสดงสถานที่ที่สมาชิกบันทึกร่วมกัน */
export default async function RoomMapPage({
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
          <p className={styles.eyebrow}>แผนที่ของห้อง</p>
          <h1 className={styles.title}>สถานที่ที่อยากจำไว้ด้วยกัน</h1>
          <p className={styles.description}>
            แตะบนแผนที่เพื่อปักหมุดร้านโปรด ที่เที่ยว หรือสถานที่สำคัญของห้องนี้
            ถ้าอยากเริ่มจากจุดที่คุณอยู่ ให้กดปุ่มใช้ตำแหน่งปัจจุบัน
          </p>
        </div>
      </section>

      <PlaceMapWorkspace
        places={places}
        roomCode={context.roomCode}
        roomId={context.roomId}
      />

      <section className={styles.sidePanel}>
        <div className={styles.sectionHeader}>
          <h2>สถานที่ทั้งหมด</h2>
          <p>{places.length} จุดในห้องนี้</p>
        </div>

        {places.length ? (
          <ul className={styles.placeList}>
            {places.map((place) => (
              <li className={styles.placeItem} key={place.id}>
                <h3>{place.name}</h3>
                {place.description ? <p>{place.description}</p> : null}
                <span className={styles.placeMeta}>
                  {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                  {place.placeDate ? ` · ${formatPlaceDate(place.placeDate)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>
            ยังไม่มีสถานที่ในห้องนี้ แตะบนแผนที่เพื่อปักหมุดแรกได้เลย
          </p>
        )}
      </section>
    </div>
  );
}
