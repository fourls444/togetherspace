import { PlaceMapWorkspace } from "@/components/places/place-map-workspace";
import type { PlaceMapItem } from "@/components/places/place-map";
import styles from "@/components/places/place-map.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
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
            แตะบนแผนที่หรือค้นหาเพื่อปักหมุดที่เที่ยว/ร้านโปรดของห้องนี้
            ถ้าอยากเริ่มจากจุดที่คุณอยู่ ให้กดปุ่มใช้ตำแหน่งปัจจุบัน
          </p>
        </div>
      </section>

      {/*
        PlaceMapWorkspace รับ places ทั้งหมดและจัดการ:
        - แผนที่ + หมุดทั้งหมด
        - ฟอร์มเพิ่มสถานที่ใหม่
        - ช่องค้นหา
      */}
      <PlaceMapWorkspace
        initialFlyToPlaceId={placeId}
        places={places}
        roomCode={context.roomCode}
        roomId={context.roomId}
      />
    </div>
  );
}
