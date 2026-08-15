"use client";

import { useRouter } from "next/navigation";

import DepthCarousel from "@/components/effects/depth-carousel/DepthCarousel";
import styles from "@/components/rooms/room-home.module.css";

type Photo = {
  id: string;
  image_url: string;
  caption: string | null;
};

type RoomPhotoWallProps = {
  albumHref: string;
  photos: Photo[];
};

export function RoomPhotoWall({ albumHref, photos }: RoomPhotoWallProps) {
  const router = useRouter();

  if (photos.length === 0) return null;

  return (
    <div className={styles.carousel}>
      <DepthCarousel
        ariaLabel="รูปล่าสุดในอัลบั้ม"
        autoplay={photos.length > 1}
        items={photos.map((photo) => ({
          alt: photo.caption?.trim() || "รูปในอัลบั้ม",
          image: photo.image_url,
        }))}
        loop
        showControls={false}
        showIndicators={false}
        tint="#0A0908"
      />
    </div>
  );
}
