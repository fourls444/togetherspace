import {
  BedDouble,
  Coffee,
  Dumbbell,
  GraduationCap,
  Hospital,
  Landmark,
  MapPin,
  ShoppingBag,
  Trees,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { getPlaceIconKey, type PlaceIconKey } from "@/lib/places/place-icon";

const PLACE_ICONS: Record<PlaceIconKey, LucideIcon> = {
  accommodation: BedDouble,
  beach: Waves,
  coffee: Coffee,
  default: MapPin,
  education: GraduationCap,
  entertainment: Landmark,
  health: Hospital,
  landmark: Landmark,
  park: Trees,
  restaurant: Utensils,
  shopping: ShoppingBag,
  sport: Dumbbell,
};

/** แสดงไอคอนสถานที่จากประเภทที่ระบบหาได้ในชื่อและรายละเอียด */
export function PlaceTypeIcon({
  description,
  name,
}: {
  description: string | null;
  name: string;
}) {
  const Icon = PLACE_ICONS[getPlaceIconKey(name, description)];
  return <Icon aria-hidden="true" size={18} strokeWidth={2.1} />;
}
