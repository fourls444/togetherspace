"use client";

import dynamic from "next/dynamic";

import styles from "@/components/places/place-globe.module.css";
import type { PlaceMapItem } from "@/components/places/place-map";
import type {
  GlobeFrame,
  GlobeLookTarget,
  PlaceCluster,
} from "@/lib/places/place-clusters";

const PlaceGlobe = dynamic(
  () =>
    import("@/components/places/place-globe").then((module) => module.PlaceGlobe),
  {
    loading: () => <div className={styles.loading}>กำลังโหลดลูกโลก…</div>,
    ssr: false,
  },
);

type PlaceGlobeShellProps = {
  clusters: PlaceCluster<PlaceMapItem>[];
  focusedClusterId: string | null;
  frame: GlobeFrame;
  lookAtTick: number;
  onClusterClick: (id: string) => void;
  onLookAtArrived?: () => void;
  onMarkerClick: (id: string) => void;
  onZoomIntoMap?: (position: {
    latitude: number;
    longitude: number;
  }) => void;
  places: PlaceMapItem[];
  selectedPlaceId: string | null;
  target: GlobeLookTarget | null;
};

/** ห่อลูกโลกแบบ client-only เพื่อไม่ให้ server แตะ WebGL */
export function PlaceGlobeShell(props: PlaceGlobeShellProps) {
  return <PlaceGlobe {...props} />;
}
