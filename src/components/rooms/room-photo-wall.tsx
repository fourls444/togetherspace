"use client";

import { AlbumPrints } from "@/components/effects/draggable-card/DraggableCard";
import styles from "@/components/rooms/room-home.module.css";

type Photo = {
  id: string;
  image_url: string;
  caption: string | null;
};

type RoomPhotoWallProps = {
  albumHref?: string;
  photos: Photo[];
};

/** กองรูปโพลารอยด์บนหน้าห้อง — ลากได้ กดเพื่อดูใหญ่ */
export function RoomPhotoWall({ photos }: RoomPhotoWallProps) {
  if (photos.length === 0) return null;

  return (
    <div className={styles.carousel}>
      <AlbumPrints
        ariaLabel="รูปล่าสุดในอัลบั้ม"
        items={photos.map((photo) => ({
          alt: photo.caption?.trim() || "รูปในอัลบั้ม",
          caption: photo.caption,
          id: photo.id,
          image: photo.image_url,
        }))}
      />
    </div>
  );
}
