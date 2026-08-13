"use client";

import dynamic from "next/dynamic";

import styles from "@/components/places/place-map.module.css";
import type { PlaceMapItem, PlacePosition } from "@/components/places/place-map";

const PlaceMap = dynamic(
  () => import("@/components/places/place-map").then((module) => module.PlaceMap),
  {
    loading: () => <div className={styles.mapLoading}>กำลังโหลดแผนที่…</div>,
    ssr: false,
  },
);

type PlaceMapShellProps = {
  flyToPosition: PlacePosition | null;
  flyToTick: number;
  focusTick: number;
  onLocate: () => void;
  onMarkerClick: (id: string) => void;
  onSelectPosition: (position: PlacePosition) => void;
  places: PlaceMapItem[];
  selectedPlaceId: string | null;
  selectedPosition: PlacePosition | null;
  userPosition: PlacePosition | null;
};

/** ห่อ Leaflet แบบ client-only เพื่อไม่ให้ server render แตะ window/document */
export function PlaceMapShell(props: PlaceMapShellProps) {
  return <PlaceMap {...props} />;
}
