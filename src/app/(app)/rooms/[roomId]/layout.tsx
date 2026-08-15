import type { PropsWithChildren } from "react";

import { RoomChrome } from "@/components/rooms/room-chrome";
import {
  RoomChatWidget,
  type RoomChatMessage,
} from "@/components/rooms/room-chat-widget";
import styles from "@/components/rooms/room-chrome.module.css";
import { RoomNav } from "@/components/rooms/room-nav";
import { RoomThemeProvider } from "@/components/rooms/room-theme-provider";
import { getRoomPath, getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

type RoomContext = Awaited<ReturnType<typeof getRoomContext>>;
type MemberRoomContext = Extract<RoomContext, { isMember: true }>;

/** โหลดข้อความเริ่มต้นของแชทพร้อมชื่อและรูปผู้ส่ง เพื่อให้เปิดหน้าห้องแล้วเห็นบทสนทนาล่าสุดทันที */
async function getInitialRoomChatMessages({
  roomId,
  supabase,
}: Pick<MemberRoomContext, "roomId" | "supabase">): Promise<
  RoomChatMessage[]
> {
  const { data: rows } = await supabase
    .from("room_messages")
    .select("id, user_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(50);

  const messages = [...(rows ?? [])].reverse();
  const userIds = [...new Set(messages.map((message) => message.user_id))];

  if (userIds.length === 0) return [];

  const [profilesResult, roomProfilesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds),
    supabase
      .from("room_profiles")
      .select("user_id, display_name, avatar_url")
      .eq("room_id", roomId)
      .in("user_id", userIds),
  ]);

  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [
      profile.user_id,
      profile,
    ]),
  );

  return messages.map((message) => {
    const profile = profiles.get(message.user_id);
    const roomProfile = roomProfiles.get(message.user_id);

    return {
      body: message.body,
      createdAt: message.created_at,
      id: message.id,
      senderAvatarUrl:
        roomProfile?.avatar_url ??
        profile?.avatar_url ??
        getDefaultImageUrl("profile"),
      senderName:
        roomProfile?.display_name ?? profile?.display_name ?? "สมาชิก",
      senderUsername: profile?.username ?? "member",
      userId: message.user_id,
    };
  });
}

/** โครงห้อง — alcove ซ้ายเลือกเนื้อหา, ขวาเป็นเวทีเต็มจอ */
export default async function RoomLayout({
  children,
  params,
}: PropsWithChildren<{
  params: Promise<{ roomId: string }>;
}>) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return <div className={styles.guest}>{children}</div>;
  }

  const { currentUserId, roomCode, room, roomId, supabase } = context;
  const roomPath = getRoomPath(roomCode);
  const initialChatMessages = await getInitialRoomChatMessages({
    roomId,
    supabase,
  });
  const roomAvatarUrl = room.avatar_url || getDefaultImageUrl("room");

  return (
    <RoomThemeProvider roomCode={roomCode} roomType={room.type}>
      <RoomChrome
        roomType={room.type}
        nav={
          <RoomNav
            items={[
              { href: roomPath, label: "หน้าห้อง", exact: true },
              { href: getRoomSubPath(roomCode, "board"), label: "บอร์ด" },
              { href: getRoomSubPath(roomCode, "calendar"), label: "ปฏิทิน" },
              { href: getRoomSubPath(roomCode, "album"), label: "อัลบั้ม" },
              { href: getRoomSubPath(roomCode, "map"), label: "แผนที่" },
              { href: getRoomSubPath(roomCode, "finance"), label: "การเงิน" },
              { href: getRoomSubPath(roomCode, "members"), label: "คนในห้อง" },
            ]}
            footerItems={[
              { href: getRoomSubPath(roomCode, "settings"), label: "ตั้งค่า" },
            ]}
          />
        }
      >
        {children}
        <RoomChatWidget
          currentUserId={currentUserId}
          initialMessages={initialChatMessages}
          roomAvatarUrl={roomAvatarUrl}
          roomCode={roomCode}
          roomId={roomId}
          roomName={room.name}
        />
      </RoomChrome>
    </RoomThemeProvider>
  );
}
