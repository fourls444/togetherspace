"use client";

import { useCallback, useState } from "react";

import { PlaceForm } from "@/components/places/place-form";
import { PlaceMapShell } from "@/components/places/place-map-shell";
import type { PlaceMapItem, PlacePosition } from "@/components/places/place-map";
import { PlaceSearch } from "@/components/places/place-search";
import { ButtonLink } from "@/components/ui/button-link";
import { Modal } from "@/components/ui/modal";
import type { GeocodeResult } from "@/lib/geocoding";
import { reverseGeocode } from "@/lib/geocoding";
import styles from "@/components/places/place-map.module.css";

type PlaceMapWorkspaceProps = {
  initialFlyToPlaceId?: string;
  places: PlaceMapItem[];
  roomCode: string;
  roomId: string;
};

/** จัดการ state กลางของหน้าแผนที่ ทั้งการปักหมุดใหม่ การค้นหา และการโฟกัสสถานที่ */
export function PlaceMapWorkspace({
  initialFlyToPlaceId,
  places,
  roomCode,
  roomId,
}: PlaceMapWorkspaceProps) {
  const initialPlace = initialFlyToPlaceId
    ? places.find((place) => place.id === initialFlyToPlaceId)
    : null;

  const [selectedPosition, setSelectedPosition] =
    useState<PlacePosition | null>(null);
  const [draftAddress, setDraftAddress] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<PlacePosition | null>(null);
  const [locationTick, setLocationTick] = useState(0);
  const [flyToPosition, setFlyToPosition] = useState<PlacePosition | null>(
    initialPlace
      ? { latitude: initialPlace.latitude, longitude: initialPlace.longitude }
      : null,
  );
  const [flyToTick, setFlyToTick] = useState(initialPlace ? 1 : 0);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    initialPlace?.id ?? null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** ขอสิทธิ์ location แล้วใช้ตำแหน่งปัจจุบันเป็นหมุดร่าง */
  function requestCurrentLocation() {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserPosition(nextPosition);
        setSelectedPosition(nextPosition);
        setLocationTick((current) => current + 1);
        setIsModalOpen(true);

        const address = await reverseGeocode(
          nextPosition.latitude,
          nextPosition.longitude,
        );
        setDraftAddress(address);
      },
      () => {
        // Browser จะแสดงสถานะ permission เอง รอบนี้ไม่ต้องโชว์กล่อง error เพิ่ม
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
  }

  /** เลือกพิกัดจากการคลิก/แตะบนแผนที่ แล้วลองดึงชื่อสถานที่มาเติมให้ */
  async function handleSelectPosition(position: PlacePosition) {
    setSelectedPosition(position);
    setDraftAddress("กำลังดึงชื่อสถานที่...");
    setIsModalOpen(true);
    const address = await reverseGeocode(position.latitude, position.longitude);
    setDraftAddress(address);
  }

  /** โฟกัสแผนที่ไปยัง marker ที่กด */
  function handleMarkerClick(id: string) {
    const place = places.find((item) => item.id === id);
    if (!place) return;
    handleSelectPlace(place);
  }

  /** เลือกผลลัพธ์จากช่องค้นหาและวางหมุดร่างทันที */
  function handleSelectSearchResult(result: GeocodeResult) {
    const position = {
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setSelectedPosition(position);
    setDraftAddress(result.displayName);
    setFlyToPosition(position);
    setFlyToTick((current) => current + 1);
    setIsModalOpen(true);
  }

  /** เลือกสถานที่จากรายการด้านล่างซ้ายแล้ววาร์ปแผนที่ไปยังจุดนั้น */
  function handleSelectPlace(place: PlaceMapItem) {
    setSelectedPlaceId(place.id);
    setFlyToPosition({
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setFlyToTick((current) => current + 1);
  }

  /** ล้างหมุดร่างหลังบันทึกสถานที่สำเร็จ */
  const handleSaveSuccess = useCallback(() => {
    setSelectedPosition(null);
    setDraftAddress(null);
    setIsModalOpen(false);
  }, []);

  /** ยกเลิกหมุดร่างที่ยังไม่บันทึก */
  const handleCancelPin = useCallback(() => {
    setSelectedPosition(null);
    setDraftAddress(null);
    setIsModalOpen(false);
  }, []);

  return (
    <section className={styles.layoutFull}>
      <article className={styles.mapPanelFull}>
        <div className={styles.mapFrameWrapper}>
          <div className={styles.topControls}>
            <PlaceSearch onSelectResult={handleSelectSearchResult} />
          </div>

          <PlaceMapShell
            flyToPosition={flyToPosition}
            flyToTick={flyToTick}
            focusTick={locationTick}
            onLocate={requestCurrentLocation}
            onMarkerClick={handleMarkerClick}
            onSelectPosition={handleSelectPosition}
            places={places}
            selectedPlaceId={selectedPlaceId}
            selectedPosition={selectedPosition}
            userPosition={userPosition}
          />

          <ButtonLink
            className={styles.mapAllPlacesButton}
            href={`/rooms/${roomCode}/map/places`}
            variant="default"
          >
            ดูสถานที่ทั้งหมด
          </ButtonLink>
        </div>
      </article>

      <Modal
        description="กรอกรายละเอียดของสถานที่ที่เลือก เพื่อบันทึกไว้ในแผนที่ของห้อง"
        isOpen={isModalOpen}
        onClose={handleCancelPin}
        title="เพิ่มสถานที่ใหม่"
      >
        <PlaceForm
          draftAddress={draftAddress}
          onCancelPin={handleCancelPin}
          onSaveSuccess={handleSaveSuccess}
          roomCode={roomCode}
          roomId={roomId}
          selectedPosition={selectedPosition}
        />
      </Modal>
    </section>
  );
}
