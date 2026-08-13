import { NextResponse, type NextRequest } from "next/server";

type NominatimSearchItem = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/** เรียก Nominatim จากฝั่ง server เพื่อไม่ให้ browser เจอ 404/ข้อจำกัด header โดยตรง */
async function fetchNominatim(path: string, searchParams: URLSearchParams) {
  const url = new URL(path, NOMINATIM_BASE_URL);
  searchParams.forEach((value, key) => url.searchParams.set(key, value));

  return fetch(url, {
    headers: {
      "User-Agent": "TogetherSpace/1.0",
    },
  });
}

/** คืนผลค้นหา/แปลงพิกัดเป็นชื่อสถานที่ โดยซ่อน external 404 ให้กลายเป็นข้อมูลว่างที่ UI จัดการได้ */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode");

  if (mode === "search") {
    const query = searchParams.get("q")?.trim() ?? "";
    if (!query) return NextResponse.json({ results: [] });

    const params = new URLSearchParams({
      "accept-language": "th,en",
      format: "json",
      limit: "5",
      q: query,
    });
    const response = await fetchNominatim("/search", params);

    if (!response.ok) return NextResponse.json({ results: [] });

    const data = (await response.json()) as NominatimSearchItem[];
    return NextResponse.json({
      results: data.flatMap((item) => {
        if (!item.display_name || !item.lat || !item.lon) return [];
        return {
          displayName: item.display_name,
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        };
      }),
    });
  }

  if (mode === "reverse") {
    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ displayName: null });
    }

    const params = new URLSearchParams({
      "accept-language": "th,en",
      format: "json",
      lat: String(lat),
      lon: String(lon),
    });
    const response = await fetchNominatim("/reverse", params);

    if (!response.ok) return NextResponse.json({ displayName: null });

    const data = (await response.json()) as { display_name?: string };
    return NextResponse.json({ displayName: data.display_name ?? null });
  }

  return NextResponse.json({ error: "Invalid geocoding mode" }, { status: 400 });
}
