"use client";

import { useCallback, useMemo, useState } from "react";
import { Globe, Map } from "lucide-react";

import { PlaceForm } from "@/components/places/place-form";
import { PlaceGlobeMemories } from "@/components/places/place-globe-memories";
import { PlaceGlobeShell } from "@/components/places/place-globe-shell";
import { PlaceMapShell } from "@/components/places/place-map-shell";
import type { PlaceMapItem, PlacePosition } from "@/components/places/place-map";
import { PlaceSearch } from "@/components/places/place-search";
import { ButtonLink } from "@/components/ui/button-link";
import { Modal } from "@/components/ui/modal";
import type { GeocodeResult } from "@/lib/geocoding";
import { reverseGeocode } from "@/lib/geocoding";
import type { GlobeLookTarget, PlaceCluster } from "@/lib/places/place-clusters";
import {
  clusterPlaces,
  distanceKm,
  globeFrameForPlaces,
} from "@/lib/places/place-clusters";
import globeStyles from "@/components/places/place-globe.module.css";
import styles from "@/components/places/place-map.module.css";

type MapView = "globe" | "map";

function findNearestPlace(
  places: PlaceMapItem[],
  position: PlacePosition,
  maxKm: number,
) {
  let nearest: PlaceMapItem | null = null;
  let nearestKm = maxKm;
  for (const place of places) {
    const km = distanceKm(place, position);
    if (km < nearestKm) {
      nearest = place;
      nearestKm = km;
    }
  }
  return nearest;
}

type PlaceMapWorkspaceProps = {
  initialFlyToPlaceId?: string;
  places: PlaceMapItem[];
  roomCode: string;
  roomId: string;
};

/** จัดการลูกโลก แผนที่ถนน การปักหมุด และการโฟกัสสถานที่ในห้อง */
export function PlaceMapWorkspace({
  initialFlyToPlaceId,
  places,
  roomCode,
  roomId,
}: PlaceMapWorkspaceProps) {
  const initialPlace = initialFlyToPlaceId
    ? places.find((place) => place.id === initialFlyToPlaceId)
    : null;

  const [view, setView] = useState<MapView>(initialPlace ? "map" : "globe");
  const [openStreetAfterLook, setOpenStreetAfterLook] = useState(false);
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
  const [lookAtTick, setLookAtTick] = useState(0);
  const [seekTarget, setSeekTarget] = useState<GlobeLookTarget | null>(null);
  const [focusedClusterId, setFocusedClusterId] = useState<string | null>(
    null,
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(
    initialPlace?.id ?? null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const clusters = useMemo(() => clusterPlaces(places), [places]);
  const overviewFrame = useMemo(
    () => globeFrameForPlaces(places),
    [places],
  );

  const selectedPlace = selectedPlaceId
    ? places.find((place) => place.id === selectedPlaceId)
    : null;

  /** ขอสิทธิ์ location แล้วใช้ตำแหน่งปัจจุบันเป็นหมุดร่างบนแผนที่ถนน */
  function requestCurrentLocation() {
    if (!("geolocation" in navigator)) return;
    setView("map");

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

  /** โฟกัสหมุดบนแผนที่ถนน */
  function focusStreetMap(place: PlaceMapItem) {
    setSelectedPlaceId(place.id);
    setFlyToPosition({
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setFlyToTick((current) => current + 1);
    setView("map");
    setOpenStreetAfterLook(false);
  }

  /** เปิดแผนที่ถนนตรงจุดที่ซูมเข้าไปบนลูกโลก */
  function handleZoomIntoMap(position: PlacePosition) {
    const nearby = findNearestPlace(places, position, 150);
    if (nearby) {
      focusStreetMap(nearby);
      return;
    }
    setSelectedPlaceId(null);
    setFlyToPosition(position);
    setFlyToTick((current) => current + 1);
    setView("map");
    setOpenStreetAfterLook(false);
  }

  /** หมุนลูกโลกไปยังสถานที่ แล้วค่อยเปิดแผนที่ถนนเมื่อหันถึง */
  function lookAtPlace(place: PlaceMapItem, thenOpenMap: boolean) {
    setSelectedPlaceId(place.id);
    setSeekTarget({
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setLookAtTick((current) => current + 1);
    setOpenStreetAfterLook(thenOpenMap);
    setView("globe");
  }

  /** ซูมเข้ากลุ่มเมืองบนลูกโลก แล้วย่อยเป็นหมุด */
  function lookAtCluster(cluster: PlaceCluster<PlaceMapItem>) {
    if (cluster.places.length === 1 && cluster.places[0]) {
      lookAtPlace(cluster.places[0], true);
      return;
    }
    setFocusedClusterId(cluster.id);
    setSelectedPlaceId(null);
    setSeekTarget(globeFrameForPlaces(cluster.places));
    setLookAtTick((current) => current + 1);
    setOpenStreetAfterLook(false);
    setView("globe");
  }

  /** กลับไปภาพรวมทุกเมือง */
  function lookAtOverview() {
    setFocusedClusterId(null);
    setOpenStreetAfterLook(false);
    setSeekTarget(overviewFrame);
    setLookAtTick((current) => current + 1);
    setView("globe");
  }

  /** กดหมุดบนแผนที่ถนน */
  function handleStreetMarkerClick(id: string) {
    const place = places.find((item) => item.id === id);
    if (!place) return;
    focusStreetMap(place);
  }

  /** กดหมุดบนลูกโลก — หมุนหาจุดนั้น แล้วเปิดแผนที่ถนน */
  function handleGlobeMarkerClick(id: string) {
    const place = places.find((item) => item.id === id);
    if (!place) return;
    lookAtPlace(place, true);
  }

  function handleClusterClick(id: string) {
    const cluster = clusters.find((item) => item.id === id);
    if (!cluster) return;
    lookAtCluster(cluster);
  }

  /** เลือกผลลัพธ์จากช่องค้นหาและวางหมุดร่างบนแผนที่ถนน */
  function handleSelectSearchResult(result: GeocodeResult) {
    const position = {
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setView("map");
    setSelectedPosition(position);
    setDraftAddress(result.displayName);
    setFlyToPosition(position);
    setFlyToTick((current) => current + 1);
    setIsModalOpen(true);
  }

  /** กดแถบความทรงจำ: ถ้าอยู่บนลูกโลกให้หมุน ถ้าอยู่แผนที่ให้วาร์ป */
  function handleSelectPlace(place: PlaceMapItem) {
    if (view === "globe") {
      lookAtPlace(place, true);
      return;
    }
    focusStreetMap(place);
  }

  /** ลูกโลกหันถึงจุดแล้ว — เปิดแผนที่ถนนถ้าผู้ใช้กดหมุดหรือความทรงจำ */
  function handleLookAtArrived() {
    setSeekTarget(null);
    if (!openStreetAfterLook || !selectedPlace) return;
    focusStreetMap(selectedPlace);
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
          <div className={globeStyles.chrome}>
            <div className={globeStyles.toolbar}>
              <PlaceSearch
                onSelectResult={handleSelectSearchResult}
                variant="inline"
              />
              <div
                aria-label="มุมมองแผนที่"
                className={globeStyles.viewToggle}
                role="group"
              >
                <button
                  aria-pressed={view === "globe"}
                  onClick={() => {
                    setOpenStreetAfterLook(false);
                    setFocusedClusterId(null);
                    setView("globe");
                  }}
                  type="button"
                >
                  <Globe aria-hidden size={16} />
                  ลูกโลก
                </button>
                <button
                  aria-pressed={view === "map"}
                  onClick={() => {
                    setOpenStreetAfterLook(false);
                    setView("map");
                  }}
                  type="button"
                >
                  <Map aria-hidden size={16} />
                  แผนที่
                </button>
              </div>
            </div>
          </div>

          {view === "globe" ? (
            <PlaceGlobeShell
              clusters={clusters}
              focusedClusterId={focusedClusterId}
              frame={overviewFrame}
              lookAtTick={lookAtTick}
              onClusterClick={handleClusterClick}
              onLookAtArrived={handleLookAtArrived}
              onMarkerClick={handleGlobeMarkerClick}
              onZoomIntoMap={handleZoomIntoMap}
              places={places}
              selectedPlaceId={selectedPlaceId}
              target={seekTarget}
            />
          ) : (
            <PlaceMapShell
              flyToPosition={flyToPosition}
              flyToTick={flyToTick}
              focusTick={locationTick}
              onLocate={requestCurrentLocation}
              onMarkerClick={handleStreetMarkerClick}
              onSelectPosition={handleSelectPosition}
              places={places}
              selectedPlaceId={selectedPlaceId}
              selectedPosition={selectedPosition}
              userPosition={userPosition}
            />
          )}

          {view === "globe" ? (
            <PlaceGlobeMemories
              clusters={clusters}
              focusedClusterId={focusedClusterId}
              onSelectCluster={lookAtCluster}
              onSelectOverview={lookAtOverview}
              onSelectPlace={handleSelectPlace}
              selectedPlaceId={selectedPlaceId}
            />
          ) : null}

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
