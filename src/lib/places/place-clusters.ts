type ClusterablePlace = {
  creatorAvatarUrl?: string;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
};

export type PlaceCluster<T extends ClusterablePlace = ClusterablePlace> = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  places: T[];
};

export type GlobeLookTarget = {
  distance?: number;
  latitude: number;
  longitude: number;
};

export type GlobeFrame = GlobeLookTarget & {
  distance: number;
};

type NamedPlace = {
  latitude: number;
  longitude: number;
  matchKm: number;
  name: string;
};

const CLUSTER_RADIUS_KM = 38;

const THAI_CITIES: NamedPlace[] = [
  { name: "กรุงเทพฯ", latitude: 13.7563, longitude: 100.5018, matchKm: 48 },
  { name: "เชียงใหม่", latitude: 18.7883, longitude: 98.9853, matchKm: 42 },
  { name: "เชียงราย", latitude: 19.9105, longitude: 99.8406, matchKm: 36 },
  { name: "ภูเก็ต", latitude: 7.8804, longitude: 98.3923, matchKm: 36 },
  { name: "พัทยา", latitude: 12.9236, longitude: 100.8825, matchKm: 28 },
  { name: "หัวหิน", latitude: 12.5684, longitude: 99.9577, matchKm: 28 },
  { name: "ขอนแก่น", latitude: 16.4419, longitude: 102.836, matchKm: 36 },
  { name: "โคราช", latitude: 14.9799, longitude: 102.0978, matchKm: 36 },
  { name: "อุดรธานี", latitude: 17.4156, longitude: 102.7855, matchKm: 32 },
  { name: "หาดใหญ่", latitude: 7.0084, longitude: 100.4767, matchKm: 32 },
  { name: "กระบี่", latitude: 8.0863, longitude: 98.9063, matchKm: 32 },
  { name: "สมุย", latitude: 9.512, longitude: 100.0136, matchKm: 28 },
  { name: "สุราษฎร์", latitude: 9.1382, longitude: 99.3331, matchKm: 32 },
  { name: "อยุธยา", latitude: 14.3692, longitude: 100.5877, matchKm: 24 },
  { name: "กาญจนบุรี", latitude: 14.0227, longitude: 99.5328, matchKm: 32 },
  { name: "ระยอง", latitude: 12.6814, longitude: 101.2816, matchKm: 28 },
  { name: "นครศรีฯ", latitude: 8.4304, longitude: 99.9631, matchKm: 32 },
  { name: "อุบลฯ", latitude: 15.2286, longitude: 104.8564, matchKm: 32 },
  { name: "พิษณุโลก", latitude: 16.8211, longitude: 100.2659, matchKm: 32 },
  { name: "ปาย", latitude: 19.3582, longitude: 98.4406, matchKm: 22 },
];

const WORLD_CITIES: NamedPlace[] = [
  { name: "โซล", latitude: 37.5665, longitude: 126.978, matchKm: 50 },
  { name: "โตเกียว", latitude: 35.6762, longitude: 139.6503, matchKm: 50 },
  { name: "โอซาก้า", latitude: 34.6937, longitude: 135.5023, matchKm: 40 },
  { name: "สิงคโปร์", latitude: 1.3521, longitude: 103.8198, matchKm: 40 },
  { name: "ไทเป", latitude: 25.033, longitude: 121.5654, matchKm: 40 },
  { name: "ฮ่องกง", latitude: 22.3193, longitude: 114.1694, matchKm: 40 },
  { name: "กัวลาลัมเปอร์", latitude: 3.139, longitude: 101.6869, matchKm: 40 },
  { name: "เวียงจันทน์", latitude: 17.9757, longitude: 102.6331, matchKm: 36 },
  { name: "พนมเปญ", latitude: 11.5564, longitude: 104.9282, matchKm: 36 },
  { name: "ดูไบ", latitude: 25.2048, longitude: 55.2708, matchKm: 40 },
  { name: "ปารีส", latitude: 48.8566, longitude: 2.3522, matchKm: 40 },
  { name: "ลอนดอน", latitude: 51.5074, longitude: -0.1278, matchKm: 40 },
];

const BANGKOK = { latitude: 13.7563, longitude: 100.5018 };

/** ระยะระหว่างสองพิกัดเป็นกิโลเมตร */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function isInThailand(latitude: number, longitude: number) {
  return (
    latitude >= 5.6 &&
    latitude <= 20.5 &&
    longitude >= 97.3 &&
    longitude <= 105.65
  );
}

function nearestNamedPlace(
  point: { latitude: number; longitude: number },
  places: NamedPlace[],
) {
  let nearest: NamedPlace | null = null;
  let nearestKm = Number.POSITIVE_INFINITY;
  for (const place of places) {
    const km = distanceKm(point, place);
    if (km < nearestKm) {
      nearest = place;
      nearestKm = km;
    }
  }
  return nearest && nearestKm <= nearest.matchKm
    ? nearest
    : nearest && nearestKm < 120
      ? nearest
      : null;
}

function labelForPoint(point: { latitude: number; longitude: number }) {
  if (isInThailand(point.latitude, point.longitude)) {
    return nearestNamedPlace(point, THAI_CITIES)?.name ?? "ไทย";
  }
  return nearestNamedPlace(point, WORLD_CITIES)?.name ?? "ต่างประเทศ";
}

function centroid<T extends ClusterablePlace>(places: T[]) {
  return {
    latitude:
      places.reduce((sum, place) => sum + place.latitude, 0) / places.length,
    longitude:
      places.reduce((sum, place) => sum + place.longitude, 0) / places.length,
  };
}

function spanKm<T extends ClusterablePlace>(places: T[]) {
  if (places.length < 2) return 0;
  const center = centroid(places);
  return Math.max(
    ...places.map((place) => distanceKm(center, place) * 2),
  );
}

/** ระยะกล้องในหน่วยลูกโลก (รัศมีโลก = 2) ให้หมุดอยู่ในเฟรม */
export function cameraDistanceForSpanKm(span: number) {
  if (span < 90) return 5.2;
  if (span < 1600) return 5.65;
  return Math.min(7.2, 5.7 + ((span - 1600) / 2400) * 1.4);
}

/** จุดกึ่งกลางและระยะกล้องที่ครอบคลุมหมุดทั้งหมด */
export function globeFrameForPlaces<T extends ClusterablePlace>(
  places: T[],
): GlobeFrame {
  if (places.length === 0) {
    return { ...BANGKOK, distance: 7 };
  }
  const center = centroid(places);
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    distance: cameraDistanceForSpanKm(spanKm(places)),
  };
}

/** ยุบหมุดที่อยู่ใกล้กันเป็นกลุ่มเมือง */
export function clusterPlaces<T extends ClusterablePlace>(
  places: T[],
): PlaceCluster<T>[] {
  const remaining = [...places];
  const clusters: PlaceCluster<T>[] = [];

  while (remaining.length > 0) {
    const seed = remaining.shift();
    if (!seed) break;
    const members: T[] = [seed];
    let grew = true;
    while (grew) {
      grew = false;
      const center = centroid(members);
      for (let index = remaining.length - 1; index >= 0; index -= 1) {
        const candidate = remaining[index];
        if (distanceKm(center, candidate) > CLUSTER_RADIUS_KM) continue;
        members.push(candidate);
        remaining.splice(index, 1);
        grew = true;
      }
    }
    const center = centroid(members);
    clusters.push({
      id: `cluster-${members.map((place) => place.id).sort().join("-")}`,
      label: labelForPoint(center),
      latitude: center.latitude,
      longitude: center.longitude,
      places: members,
    });
  }

  return clusters.sort((a, b) => b.places.length - a.places.length);
}

/** รูปคนที่ไม่ซ้ำในกลุ่ม สำหรับชิปเมือง */
export function clusterAvatarUrls<T extends ClusterablePlace>(
  places: T[],
  fallback: string,
  limit = 3,
) {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const place of places) {
    const url = place.creatorAvatarUrl ?? fallback;
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= limit) break;
  }
  return urls.length > 0 ? urls : [fallback];
}
