"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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
        onActivate={(_, index) => setSelectedPhoto(photos[index] ?? null)}
        cardHeight={360}
        cardWidth={280}
        visibleCards={3}
        tint="#0A0908"
      />
      {selectedPhoto ? (
        <div
          aria-label="ดูรูปเต็ม"
          className={styles.photoLightbox}
          onClick={() => setSelectedPhoto(null)}
          role="presentation"
        >
          <div
            aria-modal="true"
            className={styles.photoLightboxPanel}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className={styles.photoLightboxHeader}>
              <span>{selectedPhoto.caption?.trim() || "รูปในอัลบั้ม"}</span>
              <button
                aria-label="ปิดรูปเต็ม"
                className={styles.photoLightboxClose}
                onClick={() => setSelectedPhoto(null)}
                type="button"
              >
                ×
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={selectedPhoto.caption?.trim() || "รูปในอัลบั้ม"}
              src={selectedPhoto.image_url}
            />
            <Link className={styles.photoLightboxLink} href={albumHref}>
              เปิดอัลบั้มเพื่อดูรายละเอียด
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
