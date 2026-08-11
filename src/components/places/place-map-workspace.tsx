"use client";

import { useState } from "react";

import { PlaceForm } from "@/components/places/place-form";
import { PlaceMapShell } from "@/components/places/place-map-shell";
import type { PlaceMapItem, PlacePosition } from "@/components/places/place-map";
import styles from "@/components/places/place-map.module.css";

type PlaceMapWorkspaceProps = {
  places: PlaceMapItem[];
  roomCode: string;
  roomId: string;
};

/** จัดการ state กลางของแผนที่: หมุดที่เลือก, ตำแหน่งผู้ใช้ และการขอสิทธิ์ location */
export function PlaceMapWorkspace({
  places,
  roomCode,
  roomId,
}: PlaceMapWorkspaceProps) {
  const [selectedPosition, setSelectedPosition] = useState<PlacePosition | null>(
    null,
  );
  const [userPosition, setUserPosition] = useState<PlacePosition | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationTick, setLocationTick] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

  /** ขอพิกัดจาก browser แล้วใช้เป็นหมุดร่างสำหรับเพิ่มสถานที่ */
  function requestCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocationMessage("อุปกรณ์นี้ไม่รองรับการหาตำแหน่งปัจจุบัน");
      return;
    }

    setIsLocating(true);
    setLocationMessage("กำลังขอตำแหน่งปัจจุบัน…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserPosition(nextPosition);
        setSelectedPosition(nextPosition);
        setLocationTick((current) => current + 1);
        setLocationMessage("ใช้ตำแหน่งปัจจุบันเป็นหมุดแล้ว");
        setIsLocating(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "ต้องอนุญาต Location ใน browser ก่อนถึงจะใช้ตำแหน่งปัจจุบันได้"
            : "หาตำแหน่งปัจจุบันไม่สำเร็จ ลองใหม่อีกครั้ง";
        setLocationMessage(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      },
    );
  }

  /** เลือกพิกัดใหม่จากการคลิกหรือแตะบนแผนที่ */
  function handleSelectPosition(position: PlacePosition) {
    setSelectedPosition(position);
    setLocationMessage("เลือกตำแหน่งสำหรับหมุดใหม่แล้ว");
  }

  return (
    <section className={styles.layout}>
      <article className={styles.mapPanel}>
        <PlaceMapShell
          focusTick={locationTick}
          onLocate={requestCurrentLocation}
          onSelectPosition={handleSelectPosition}
          places={places}
          selectedPosition={selectedPosition}
          userPosition={userPosition}
        />
      </article>

      <aside className={styles.sidePanel}>
        <div className={styles.sectionHeader}>
          <h2>เพิ่มสถานที่</h2>
          <p>
            แตะหรือคลิกบนแผนที่เพื่อวางหมุด หรือใช้ตำแหน่งปัจจุบันเพื่อเริ่มจากจุดที่คุณอยู่
          </p>
        </div>
        <div className={styles.locationActions}>
          <button
            className={styles.locationButton}
            disabled={isLocating}
            onClick={requestCurrentLocation}
            type="button"
          >
            {isLocating ? "กำลังหา…" : "ใช้ตำแหน่งปัจจุบัน"}
          </button>
          {locationMessage ? (
            <p className={styles.locationMessage}>{locationMessage}</p>
          ) : null}
        </div>
        <PlaceForm
          roomCode={roomCode}
          roomId={roomId}
          selectedPosition={selectedPosition}
        />
      </aside>
    </section>
  );
}
