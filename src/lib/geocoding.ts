export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

type SearchResponse = {
  results?: GeocodeResult[];
};

type ReverseResponse = {
  displayName?: string | null;
};

/** สร้าง URL ไปยัง proxy ภายในเว็บ เพื่อกันไม่ให้ browser เจอ 404 จาก API ภายนอกโดยตรง */
function getGeocodingUrl(mode: "reverse" | "search") {
  const baseUrl =
    typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;
  const url = new URL("/api/geocoding", baseUrl);
  url.searchParams.set("mode", mode);
  return url;
}

/** ค้นหาสถานที่จากชื่อผ่าน proxy ของแอป */
export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];

  const url = getGeocodingUrl("search");
  url.searchParams.set("q", query);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const data = (await response.json()) as SearchResponse;
    return data.results ?? [];
  } catch (error) {
    console.error("Geocoding search error:", error);
    return [];
  }
}

/** แปลงพิกัดเป็นชื่อสถานที่ผ่าน proxy ของแอป และคืน null ถ้าพิกัดนั้นไม่มีชื่อ */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  const url = getGeocodingUrl("reverse");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lon.toString());

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as ReverseResponse;
    return data.displayName || null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
