import {
  AlbumPhotoGrid,
  type AlbumPhotoView,
} from "@/components/albums/album-photo-grid";
import { AlbumUploader } from "@/components/albums/album-uploader";
import styles from "@/components/albums/album.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { getRoomContext } from "@/lib/rooms/server";
import type { RoomRole } from "@/lib/types/database";

/** หน้าอัลบั้มของห้อง สำหรับอัปโหลดและดูรูปที่สมาชิกแชร์ร่วมกัน */
export default async function RoomAlbumPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.stack}>
        <ErrorState
          description="ถ้าต้องการดูอัลบั้มนี้ กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าหลัก</ButtonLink>
      </div>
    );
  }

  const [roleResult, photosResult] = await Promise.all([
    context.supabase
      .from("room_members")
      .select("role")
      .eq("room_id", context.roomId)
      .eq("user_id", context.currentUserId)
      .maybeSingle(),
    context.supabase
      .from("album_photos")
      .select(
        "id, image_url, storage_path, caption, taken_at, sort_order, created_at, uploaded_by",
      )
      .eq("room_id", context.roomId)
      .order("taken_at", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  const roomRole = (roleResult.data?.role ?? "member") as RoomRole;
  const photos = (photosResult.data ?? []) as AlbumPhotoView[];

  return (
    <div className={styles.stack} id="album">
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>อัลบั้มของห้อง</p>
          <h1 className={styles.title}>เก็บรูปความทรงจำไว้ด้วยกัน</h1>
          <p className={styles.muted}>
            รูปใหม่จะถูกเรียงตามลำดับที่เลือกอัปโหลด และถ้าไม่เลือกวันที่
            ระบบจะใช้วันที่อัปโหลดให้อัตโนมัติ
          </p>
        </div>
      </section>

      <div className={styles.albumToolbar}>
        <div>
          <p className={styles.kicker}>จัดการอัลบั้ม</p>
          <p className={styles.muted}>เพิ่มรูปใหม่หรือจัดลำดับรูปในแต่ละวัน</p>
        </div>
        <AlbumUploader
          currentUserId={context.currentUserId}
          roomCode={context.roomCode}
          roomId={context.roomId}
        />
      </div>

      <AlbumPhotoGrid
        currentUserId={context.currentUserId}
        key={photos
          .map((photo) => `${photo.id}:${photo.taken_at}:${photo.sort_order}`)
          .join("|")}
        photos={photos}
        roomCode={context.roomCode}
        roomId={context.roomId}
        roomRole={roomRole}
      />
    </div>
  );
}
