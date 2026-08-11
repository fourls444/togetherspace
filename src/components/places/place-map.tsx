"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import styles from "@/components/places/place-map.module.css";

export type PlacePosition = {
  latitude: number;
  longitude: number;
};

export type PlaceMapItem = PlacePosition & {
  id: string;
  name: string;
  description: string | null;
  placeDate: string | null;
};

type PlaceMapProps = {
  focusTick: number;
  onLocate: () => void;
  onSelectPosition: (position: PlacePosition) => void;
  places: PlaceMapItem[];
  selectedPosition: PlacePosition | null;
  userPosition: PlacePosition | null;
};

const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];

const placeIcon = L.divIcon({
  className: styles.placeMarker,
  html: "<span></span>",
  iconAnchor: [14, 28],
  iconSize: [28, 28],
  popupAnchor: [0, -26],
});

const draftIcon = L.divIcon({
  className: styles.draftMarker,
  html: "<span></span>",
  iconAnchor: [15, 30],
  iconSize: [30, 30],
  popupAnchor: [0, -28],
});

const userIcon = L.divIcon({
  className: styles.userMarker,
  html: "<span></span>",
  iconAnchor: [10, 10],
  iconSize: [20, 20],
});

function getInitialCenter(places: PlaceMapItem[]): [number, number] {
  const firstPlace = places[0];
  if (!firstPlace) return BANGKOK_CENTER;
  return [firstPlace.latitude, firstPlace.longitude];
}

function toLatLng(position: PlacePosition): [number, number] {
  return [position.latitude, position.longitude];
}

function formatPlaceDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function formatCoordinate(position: PlacePosition) {
  return `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
}

/** รับ click/tap จากแผนที่แล้วส่งพิกัดกลับไปให้ form */
function MapClickHandler({
  onSelectPosition,
}: {
  onSelectPosition: (position: PlacePosition) => void;
}) {
  useMapEvents({
    click(event) {
      onSelectPosition({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

/** วาร์ปแผนที่ไปตำแหน่งผู้ใช้เมื่อกดปุ่ม location */
function MapFocusHandler({
  focusTick,
  userPosition,
}: {
  focusTick: number;
  userPosition: PlacePosition | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!userPosition) return;
    map.flyTo(toLatLng(userPosition), Math.max(map.getZoom(), 15), {
      duration: 0.65,
    });
  }, [focusTick, map, userPosition]);

  return null;
}

/** แสดงสถานที่ของห้องบนแผนที่จริง และให้แตะเพื่อเลือกหมุดใหม่ */
export function PlaceMap({
  focusTick,
  onLocate,
  onSelectPosition,
  places,
  selectedPosition,
  userPosition,
}: PlaceMapProps) {
  return (
    <div className={styles.mapFrame}>
      <MapContainer
        center={getInitialCenter(places)}
        className={styles.map}
        scrollWheelZoom
        zoom={places.length ? 12 : 10}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelectPosition={onSelectPosition} />
        <MapFocusHandler focusTick={focusTick} userPosition={userPosition} />

        {places.map((place) => (
          <Marker
            icon={placeIcon}
            key={place.id}
            position={[place.latitude, place.longitude]}
          >
            <Popup>
              <strong>{place.name}</strong>
              {place.description ? <p>{place.description}</p> : null}
              {place.placeDate ? (
                <small>{formatPlaceDate(place.placeDate)}</small>
              ) : null}
            </Popup>
          </Marker>
        ))}

        {selectedPosition ? (
          <Marker icon={draftIcon} position={toLatLng(selectedPosition)}>
            <Popup>
              <strong>หมุดใหม่</strong>
              <p>{formatCoordinate(selectedPosition)}</p>
            </Popup>
          </Marker>
        ) : null}

        {userPosition ? (
          <Marker icon={userIcon} position={toLatLng(userPosition)}>
            <Popup>ตำแหน่งปัจจุบันของคุณ</Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className={styles.mapControls}>
        <button
          aria-label="ไปตำแหน่งของฉัน"
          className={styles.mapControlButton}
          onClick={onLocate}
          title="ไปตำแหน่งของฉัน"
          type="button"
        >
          ◎
        </button>
        <span
          aria-label="แตะบนแผนที่เพื่อวางหมุด"
          title="แตะบนแผนที่เพื่อวางหมุด"
        >
          📍
        </span>
      </div>
    </div>
  );
}
