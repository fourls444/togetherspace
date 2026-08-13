"use client";

import Link from "next/link";

import AccordionGallery from "@/components/effects/accordion-gallery/AccordionGallery";
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
  if (photos.length === 0) return null;

  return (
    <>
      <div className={styles.stills}>
        {photos.slice(0, 2).map((photo) => (
          <Link
            aria-label={photo.caption?.trim() || "เปิดอัลบั้ม"}
            className={styles.still}
            href={albumHref}
            key={photo.id}
            prefetch
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={photo.caption?.trim() || "รูปในอัลบั้ม"}
              onError={(event) => {
                event.currentTarget.style.opacity = "0";
              }}
              src={photo.image_url}
            />
          </Link>
        ))}
      </div>
      <AccordionGallery
        ariaLabel="รูปล่าสุด"
        className={styles.gallery}
        defaultIndex={0}
        expandRatio={0.55}
        grayscale={false}
        items={photos.slice(0, 5).map((photo) => ({
          alt: photo.caption?.trim() || "รูปในอัลบั้ม",
          image: photo.image_url,
          label: photo.caption?.trim() || undefined,
          link: albumHref,
        }))}
        showLabels={photos.some((photo) => Boolean(photo.caption?.trim()))}
        tilt={0}
        trigger="hover"
      />
    </>
  );
}
