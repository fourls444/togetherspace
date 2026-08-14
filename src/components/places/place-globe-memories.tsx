"use client";

import type { PlaceMapItem } from "@/components/places/place-map";
import styles from "@/components/places/place-globe.module.css";
import type { PlaceCluster } from "@/lib/places/place-clusters";
import { clusterAvatarUrls } from "@/lib/places/place-clusters";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

type PlaceGlobeMemoriesProps = {
  clusters: PlaceCluster<PlaceMapItem>[];
  focusedClusterId: string | null;
  onSelectCluster: (cluster: PlaceCluster<PlaceMapItem>) => void;
  onSelectOverview: () => void;
  onSelectPlace: (place: PlaceMapItem) => void;
  selectedPlaceId: string | null;
};

/** แถบความทรงจำใต้ลูกโลก — เมืองตอนภาพรวม, สถานที่เมื่อซูมเข้ากลุ่ม */
export function PlaceGlobeMemories({
  clusters,
  focusedClusterId,
  onSelectCluster,
  onSelectOverview,
  onSelectPlace,
  selectedPlaceId,
}: PlaceGlobeMemoriesProps) {
  if (clusters.length === 0) return null;

  const focused = clusters.find((cluster) => cluster.id === focusedClusterId);
  const fallback = getDefaultImageUrl("profile");

  if (focused) {
    return (
      <div aria-label="สถานที่ในเมืองนี้" className={styles.memories}>
        <button
          className={styles.memory}
          onClick={onSelectOverview}
          type="button"
        >
          <span>ทุกที่</span>
        </button>
        {focused.places.map((place) => (
          <button
            className={`${styles.memory}${
              place.id === selectedPlaceId ? ` ${styles.memorySelected}` : ""
            }`}
            key={place.id}
            onClick={() => onSelectPlace(place)}
            type="button"
          >
            <img alt="" src={place.creatorAvatarUrl ?? fallback} />
            <span>{place.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div aria-label="เมืองบนลูกโลก" className={styles.memories}>
      {clusters.map((cluster) => {
        const avatars = clusterAvatarUrls(cluster.places, fallback);
        const single = cluster.places[0];
        const isPlace =
          cluster.places.length === 1 && single
            ? single.id === selectedPlaceId
            : false;
        return (
          <button
            className={`${styles.memory}${
              isPlace ? ` ${styles.memorySelected}` : ""
            }`}
            key={cluster.id}
            onClick={() => onSelectCluster(cluster)}
            type="button"
          >
            <span className={styles.clusterFaces}>
              {avatars.map((url, index) => (
                <img alt="" key={`${url}-${index}`} src={url} />
              ))}
            </span>
            <span>
              {cluster.places.length === 1 && single
                ? single.name
                : `${cluster.label} · ${cluster.places.length} ที่`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
