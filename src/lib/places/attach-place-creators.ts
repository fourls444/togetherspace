import type { PlaceMapItem } from "@/components/places/place-map";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

type PlaceRow = {
  created_by: string;
  description: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  place_date: string | null;
};

type ProfileRow = {
  avatar_url: string | null;
  display_name: string | null;
  id: string;
};

type RoomProfileRow = {
  avatar_url: string | null;
  display_name: string | null;
  user_id: string;
};

/** ผูกชื่อและรูปคนที่ปักหมุด โดยใช้โปรไฟล์ในห้องก่อน แล้วค่อยโปรไฟล์หลัก */
export function attachPlaceCreators(
  places: PlaceRow[],
  profiles: ProfileRow[],
  roomProfiles: RoomProfileRow[],
): PlaceMapItem[] {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const roomProfileMap = new Map(
    roomProfiles.map((profile) => [profile.user_id, profile]),
  );
  const fallbackAvatar = getDefaultImageUrl("profile");

  return places.map((place) => {
    const profile = profileMap.get(place.created_by);
    const roomProfile = roomProfileMap.get(place.created_by);

    return {
      creatorAvatarUrl:
        roomProfile?.avatar_url ?? profile?.avatar_url ?? fallbackAvatar,
      creatorName:
        roomProfile?.display_name ?? profile?.display_name ?? "สมาชิก",
      description: place.description,
      id: place.id,
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      placeDate: place.place_date,
    };
  });
}
