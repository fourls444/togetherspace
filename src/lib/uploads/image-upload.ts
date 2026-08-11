export type ImageUploadKind = "profile" | "room" | "roomProfile" | "album";

export const IMAGE_UPLOAD_BUCKETS: Record<ImageUploadKind, string> = {
  profile: "togetherspace-profile-images",
  room: "togetherspace-room-images",
  roomProfile: "togetherspace-room-images",
  album: "togetherspace-album-images",
};

export const DEFAULT_IMAGE_URLS = {
  profile: "/images/defaults/default-profile.png",
  room: "/images/defaults/default-room.png",
} as const;

type ImageObjectPathInput = {
  kind: ImageUploadKind;
  roomId?: string;
  timestamp?: number;
  userId: string;
};

/** ล้างค่าที่จะใช้เป็นชื่อไฟล์/โฟลเดอร์ เพื่อไม่ให้มีตัวอักษรพิเศษหลุดเข้า path */
function cleanPathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/** สร้าง path สำหรับเก็บรูป โดยแยกความหมายตามชนิดรูปและผูกกับ user ปัจจุบัน */
export function createImageObjectPath({
  kind,
  roomId,
  timestamp = Date.now(),
  userId,
}: ImageObjectPathInput) {
  const safeUserId = cleanPathPart(userId);
  const safeRoomId = roomId ? cleanPathPart(roomId) : null;

  if (kind === "profile") {
    return `${safeUserId}/profile-${timestamp}.webp`;
  }

  if (kind === "roomProfile" && safeRoomId) {
    return `${safeUserId}/room-profiles/${safeRoomId}-${timestamp}.webp`;
  }

  if (kind === "album" && safeRoomId) {
    return `${safeUserId}/albums/${safeRoomId}/${timestamp}.webp`;
  }

  return `${safeUserId}/room-draft-${timestamp}.webp`;
}

/** คืน bucket ที่ต้องใช้กับรูปแต่ละชนิด เพื่อให้ดูจาก Storage แล้วรู้ว่ารูปมาจากส่วนไหน */
export function getImageUploadBucket(kind: ImageUploadKind) {
  return IMAGE_UPLOAD_BUCKETS[kind];
}

/** คืนรูป default เมื่อผู้ใช้หรือห้องยังไม่ได้อัปโหลดรูปจริง */
export function getDefaultImageUrl(kind: ImageUploadKind) {
  if (kind === "room") return DEFAULT_IMAGE_URLS.room;
  return DEFAULT_IMAGE_URLS.profile;
}

/** ดึง bucket/path ออกจาก Supabase public URL เพื่อใช้ลบรูปเก่าที่เป็นของระบบเราเท่านั้น */
export function getStorageObjectFromPublicUrl(imageUrl: string | null) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const publicPrefix = "/storage/v1/object/public/";
    const publicIndex = url.pathname.indexOf(publicPrefix);
    if (publicIndex < 0) return null;

    const objectParts = url.pathname
      .slice(publicIndex + publicPrefix.length)
      .split("/")
      .filter(Boolean);
    const [bucket, ...pathParts] = objectParts;

    if (!bucket || pathParts.length === 0) return null;
    if (!Object.values(IMAGE_UPLOAD_BUCKETS).includes(bucket)) return null;

    return {
      bucket,
      path: decodeURIComponent(pathParts.join("/")),
    };
  } catch {
    return null;
  }
}
