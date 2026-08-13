export type PlaceIconKey =
  | "accommodation"
  | "beach"
  | "coffee"
  | "default"
  | "education"
  | "entertainment"
  | "health"
  | "landmark"
  | "park"
  | "restaurant"
  | "shopping"
  | "sport";

const PLACE_ICON_RULES: Array<{
  icon: PlaceIconKey;
  keywords: string[];
}> = [
  { icon: "coffee", keywords: ["คาเฟ่", "กาแฟ", "coffee", "cafe", "café"] },
  { icon: "restaurant", keywords: ["ร้านอาหาร", "ภัตตาคาร", "restaurant", "food"] },
  { icon: "beach", keywords: ["ชายหาด", "ทะเล", "เกาะ", "beach", "sea"] },
  { icon: "park", keywords: ["สวน", "อุทยาน", "ธรรมชาติ", "park", "garden", "national park"] },
  { icon: "shopping", keywords: ["ตลาด", "ห้าง", "ศูนย์การค้า", "market", "mall", "shopping"] },
  { icon: "accommodation", keywords: ["โรงแรม", "ที่พัก", "รีสอร์ต", "resort", "hotel", "hostel"] },
  { icon: "health", keywords: ["โรงพยาบาล", "คลินิก", "hospital", "clinic"] },
  { icon: "education", keywords: ["โรงเรียน", "มหาวิทยาลัย", "วิทยาลัย", "school", "university"] },
  { icon: "landmark", keywords: ["วัด", "พิพิธภัณฑ์", "อนุสาวรีย์", "museum", "temple", "landmark"] },
  { icon: "entertainment", keywords: ["โรงหนัง", "ภาพยนตร์", "คาราโอเกะ", "cinema", "movie", "karaoke"] },
  { icon: "sport", keywords: ["สนามกีฬา", "ฟิตเนส", "จักรยาน", "วิ่ง", "sport", "fitness", "bike"] },
];

/** เลือกไอคอนที่เหมาะสมจากคำสำคัญในชื่อและรายละเอียดของสถานที่ */
export function getPlaceIconKey(name: string, description: string | null): PlaceIconKey {
  const searchableText = `${name} ${description ?? ""}`.trim().toLocaleLowerCase("th");
  const matchedRule = PLACE_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => searchableText.includes(keyword)),
  );

  return matchedRule?.icon ?? "default";
}

/** สร้างลิงก์ค้นหาพิกัดบน Google Maps โดยไม่ต้องพึ่ง Google Maps SDK */
export function getGoogleMapsUrl(
  latitude: number,
  longitude: number,
): string {
  const query = encodeURIComponent(`${latitude},${longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
