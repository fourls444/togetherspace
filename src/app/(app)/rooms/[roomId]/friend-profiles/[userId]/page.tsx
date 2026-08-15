import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AtSign, Link2, MessageCircle, Phone } from "lucide-react";

import { RoomProfileForm } from "@/components/rooms/room-profile-form";
import { FriendProfileForm } from "@/components/rooms/friend-profile-form";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { GlowCard } from "@/components/ui/glow-card";
import styles from "../friend-profiles.module.css";
import detailStyles from "./profile-detail.module.css";
import { getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

/** หน้าโปรไฟล์รายคนของห้องเพื่อน แก้ไขได้เฉพาะโปรไฟล์ของตัวเอง */
export default async function FriendProfileDetailPage({
  params,
}: {
  params: Promise<{ roomId: string; userId: string }>;
}) {
  const { roomId: roomSlug, userId } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.pageMessage}>
        <ErrorState
          description="ถ้าต้องการดูโปรไฟล์เพื่อน กรุณาเข้าร่วมห้องก่อน"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าแรก</ButtonLink>
      </div>
    );
  }

  if (context.room.type !== "friend") {
    redirect(`/rooms/${context.roomCode}/members`);
  }

  const [memberResult, roomProfileResult, friendProfileResult] = await Promise.all([
    context.supabase
      .from("room_members")
      .select("user_id, role, profiles(username, display_name, avatar_url)")
      .eq("room_id", context.roomId)
      .eq("user_id", userId)
      .maybeSingle(),
    context.supabase
      .from("room_profiles")
      .select("display_name, avatar_url")
      .eq("room_id", context.roomId)
      .eq("user_id", userId)
      .maybeSingle(),
    context.supabase
      .from("friend_profiles")
      .select("bio, facebook_url, line_id, instagram_url, phone")
      .eq("room_id", context.roomId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!memberResult.data) notFound();

  const profile = Array.isArray(memberResult.data.profiles)
    ? memberResult.data.profiles[0]
    : memberResult.data.profiles;
  const displayName =
    roomProfileResult.data?.display_name ?? profile?.display_name ?? "สมาชิก";
  const avatarUrl =
    roomProfileResult.data?.avatar_url ??
    profile?.avatar_url ??
    getDefaultImageUrl("profile");
  const isSelf = context.currentUserId === userId;

  return (
    <div className={detailStyles.stack}>
      <Link
        className={detailStyles.back}
        href={getRoomSubPath(context.roomCode, "friend-profiles")}
      >
        ← โปรไฟล์เพื่อนทั้งหมด
      </Link>

      <GlowCard
        aria-label={`โปรไฟล์ของ ${displayName}`}
        contentClassName={detailStyles.panel}
        role="region"
        roomType="friend"
        tone="room"
      >
        <div className={detailStyles.hero}>
          <div className={detailStyles.cover} aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className={detailStyles.avatar} src={avatarUrl} />
          <div className={detailStyles.heroCopy}>
            <p className={detailStyles.eyebrow}>โปรไฟล์เพื่อน</p>
            <h1>{displayName}</h1>
            <p>@{profile?.username ?? "unknown"}</p>
          </div>
        </div>

        <div className={detailStyles.infoBox}>
          <h2>ข้อมูลแนะนำตัว</h2>
          {friendProfileResult.data?.bio ? <p>{friendProfileResult.data.bio}</p> : <p>ยังไม่มีคำแนะนำตัว</p>}
          <div className={detailStyles.contacts}>
            {friendProfileResult.data?.facebook_url ? <a href={friendProfileResult.data.facebook_url} rel="noreferrer" target="_blank"><Link2 size={16} /> Facebook</a> : null}
            {friendProfileResult.data?.line_id ? <span><MessageCircle size={16} /> {friendProfileResult.data.line_id}</span> : null}
            {friendProfileResult.data?.instagram_url ? <a href={friendProfileResult.data.instagram_url} rel="noreferrer" target="_blank"><AtSign size={16} /> Instagram</a> : null}
            {friendProfileResult.data?.phone ? <a href={`tel:${friendProfileResult.data.phone}`}><Phone size={16} /> {friendProfileResult.data.phone}</a> : null}
          </div>
        </div>

        {isSelf ? (
          <section className={detailStyles.editSection}>
            <h2>แก้ไขโปรไฟล์ในห้องนี้</h2>
            <p>เปลี่ยนชื่อและรูปที่เพื่อนในห้องจะเห็นได้ที่นี่</p>
            <RoomProfileForm
              defaultValues={{
                avatarUrl: roomProfileResult.data?.avatar_url ?? null,
                displayName: roomProfileResult.data?.display_name ?? null,
              }}
              mainDisplayName={profile?.display_name ?? "โปรไฟล์หลัก"}
              roomCode={context.roomCode}
              roomId={context.roomId}
            />
            <FriendProfileForm
              roomCode={context.roomCode}
              roomId={context.roomId}
              values={{
                bio: friendProfileResult.data?.bio ?? null,
                facebookUrl: friendProfileResult.data?.facebook_url ?? null,
                lineId: friendProfileResult.data?.line_id ?? null,
                instagramUrl: friendProfileResult.data?.instagram_url ?? null,
                phone: friendProfileResult.data?.phone ?? null,
              }}
            />
          </section>
        ) : null}
      </GlowCard>
    </div>
  );
}
