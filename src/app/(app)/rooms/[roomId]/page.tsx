import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { LivingCard } from "@/components/effects/living-card";
import { LivingStage } from "@/components/effects/living-stage";
import { RoomCodeCopy } from "@/components/rooms/room-code-copy";
import { RoomPhotoWall } from "@/components/rooms/room-photo-wall";
import styles from "@/components/rooms/room-home.module.css";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import {
  formatDateKey,
  formatThaiCalendarPanelDate,
} from "@/lib/calendar/calendar";
import {
  getRoomHomeModules,
  ROOM_TYPE_BLURB,
  ROOM_TYPE_THEME,
} from "@/lib/rooms/labels";
import { getRoomPath, getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";
import type { BoardItemType } from "@/lib/types/database";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";

const BOARD_TYPE_LABEL: Record<BoardItemType, string> = {
  note: "โน้ต",
  checklist: "เช็คลิสต์",
  poll: "โพล",
};

const PLACE_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const PREVIEW_LIMIT = 4;

function formatPlaceDate(date: string | null) {
  if (!date) return null;
  return PLACE_DATE_FORMATTER.format(new Date(`${date}T00:00:00.000Z`));
}

function RemainderLink({
  action,
  href,
  shown,
  total,
  unit,
}: {
  action: string;
  href: string;
  shown: number;
  total: number;
  unit: string;
}) {
  const leftover = total - shown;
  if (leftover <= 0) return null;

  return (
    <Link className={styles.remainder} href={href} prefetch>
      อีก {leftover} {unit} · {action}
    </Link>
  );
}

function Shelf({
  actionHref,
  actionLabel,
  children,
  emptyAction,
  emptyCopy,
  glowRgb,
  label,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  children?: ReactNode;
  emptyAction: string;
  emptyCopy: string;
  glowRgb: string;
  label: string;
  title: string;
}) {
  return (
    <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
      <section aria-label={label} className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <Link className={styles.more} href={actionHref} prefetch>
            {actionLabel}
          </Link>
        </div>
        {children ?? (
          <div className={styles.empty}>
            <p>{emptyCopy}</p>
            <ButtonLink href={actionHref}>{emptyAction}</ButtonLink>
          </div>
        )}
      </section>
    </LivingCard>
  );
}

/** หน้าห้อง — สรุปชีวิตในห้องจากข้อมูลที่มีอยู่ ไม่สร้างโมดูลใหม่ */
export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: roomSlug } = await params;
  const context = await getRoomContext(roomSlug);

  if (!context.isMember) {
    return (
      <div className={styles.panel}>
        <ErrorState
          description="ถ้าต้องการเข้าห้องนี้ กรุณาใช้รหัสเข้าร่วมหรือขอลิงก์เชิญจากเจ้าของห้อง"
          headingLevel={1}
          title="คุณไม่ได้อยู่ในห้องนี้"
        />
        <ButtonLink href="/dashboard">กลับหน้าหลัก</ButtonLink>
      </div>
    );
  }

  const { currentUserId, room, roomCode, roomId, supabase } = context;
  const roomHref = getRoomPath(roomCode);
  const todayKey = formatDateKey(new Date());
  const albumHref = getRoomSubPath(roomCode, "album");
  const boardHref = getRoomSubPath(roomCode, "board");
  const calendarHref = getRoomSubPath(roomCode, "calendar");
  const mapHref = getRoomSubPath(roomCode, "map");
  const membersHref = getRoomSubPath(roomCode, "members");
  const inviteHref = `${getRoomSubPath(roomCode, "settings")}#invite`;
  const modules = getRoomHomeModules(room.type);
  const albumModule = modules.find((module) => module.key === "album");
  const boardModule = modules.find((module) => module.key === "board");
  const calendarModule = modules.find((module) => module.key === "calendar");
  const mapModule = modules.find((module) => module.key === "map");
  const membersModule = modules.find((module) => module.key === "members");

  const [
    membershipsResult,
    roomProfilesResult,
    boardResult,
    eventsResult,
    photosResult,
    placesResult,
  ] = await Promise.all([
    supabase
      .from("room_members")
      .select(
        "user_id, role, joined_at, profiles(username, display_name, avatar_url)",
      )
      .eq("room_id", roomId)
      .order("joined_at"),
    supabase
      .from("room_profiles")
      .select("user_id, display_name, avatar_url")
      .eq("room_id", roomId),
    supabase.from("boards").select("id").eq("room_id", roomId).limit(1).maybeSingle(),
    supabase
      .from("calendar_events")
      .select("id, title, event_date", { count: "exact" })
      .eq("room_id", roomId)
      .gte("event_date", todayKey)
      .order("event_date")
      .limit(1),
    supabase
      .from("album_photos")
      .select("id, image_url, caption", { count: "exact" })
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("room_places")
      .select("id, name, place_date", { count: "exact" })
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(PREVIEW_LIMIT),
  ]);

  if (membershipsResult.error) {
    return (
      <div className={styles.panel}>
        <ErrorState
          description="โหลดรายชื่อในห้องไม่สำเร็จ ลองอีกครั้งได้เลย หรือกลับไปหน้าหลักก่อน"
          headingLevel={1}
          title="ยังเปิดห้องนี้ไม่ได้"
        />
        <div className={styles.actions}>
          <ButtonLink href={roomHref} variant="primary">
            ลองอีกครั้ง
          </ButtonLink>
          <ButtonLink href="/dashboard">กลับหน้าหลัก</ButtonLink>
        </div>
      </div>
    );
  }

  const boardId = boardResult.data?.id;
  const boardItemsResult = boardId
    ? await supabase
        .from("board_items")
        .select("id, item_type, title", { count: "exact" })
        .eq("board_id", boardId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(PREVIEW_LIMIT)
    : {
        count: 0,
        data: [] as { id: string; item_type: BoardItemType; title: string }[],
      };

  const memberships = membershipsResult.data ?? [];
  const currentMember = memberships.find(
    (membership) => membership.user_id === currentUserId,
  );
  const isOwner = currentMember?.role === "owner";
  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );
  const members = memberships.map((membership) => {
    const profile = Array.isArray(membership.profiles)
      ? membership.profiles[0]
      : membership.profiles;
    const roomProfile = roomProfiles.get(membership.user_id);

    return {
      avatarUrl: roomProfile?.avatar_url ?? profile?.avatar_url ?? null,
      displayName:
        roomProfile?.display_name ??
        profile?.display_name ??
        "ไม่พบชื่อสมาชิก",
      role: membership.role,
      userId: membership.user_id,
      username: profile?.username ?? "unknown",
    };
  });
  const photos = photosResult.data ?? [];
  const photoCount = photosResult.count ?? photos.length;
  const nextEvent = eventsResult.data?.[0] ?? null;
  const eventCount = eventsResult.count ?? (nextEvent ? 1 : 0);
  const boardItems = boardItemsResult.data ?? [];
  const boardCount = boardItemsResult.count ?? boardItems.length;
  const places = placesResult.data ?? [];
  const placeCount = placesResult.count ?? places.length;
  const previewMembers = members.slice(0, PREVIEW_LIMIT);
  const lampOnAlbum = !nextEvent && photos.length === 0;
  const lampOnInvite = isOwner && !nextEvent && photos.length > 0;
  const glowRgb = ROOM_TYPE_THEME[room.type].sparkRgb;

  return (
    <LivingStage
      className={styles.home}
      glowRgb={glowRgb}
      style={
        {
          "--room-accent": ROOM_TYPE_THEME[room.type].accent,
        } as CSSProperties
      }
    >
      <header className={styles.head}>
        <div className={styles.headCopy}>
          <h1 className={styles.title}>{room.name}</h1>
          <p className={styles.lead}>{ROOM_TYPE_BLURB[room.type]}</p>
        </div>
        <div className={styles.roomStats} aria-label="ข้อมูลย่อของห้อง">
          <div className={styles.statBox}>
            <span>สมาชิก</span>
            <strong>{members.length} คน</strong>
          </div>
          <RoomCodeCopy className={styles.codeBox} roomCode={roomCode} />
        </div>
      </header>

      <section aria-label={albumModule?.title ?? "รูปล่าสุด"} className={styles.wall}>
        <div className={styles.wallHead}>
          <h2 className={styles.sectionTitle}>
            {albumModule?.title ?? "รูปล่าสุด"}
          </h2>
          <Link className={styles.more} href={albumHref} prefetch>
            {photoCount > photos.length
              ? `อีก ${photoCount - photos.length} รูป · ไปอัลบั้ม`
              : "ไปอัลบั้ม"}
          </Link>
        </div>
        {photos.length > 0 ? (
          <RoomPhotoWall albumHref={albumHref} photos={photos} />
        ) : (
          <div className={styles.empty}>
            <p>ยังไม่มีรูปในอัลบั้ม เริ่มจากโมเมนต์แรกของห้องนี้ได้เลย</p>
            <ButtonLink href={albumHref} variant={lampOnAlbum ? "primary" : "default"}>
              เปิดอัลบั้ม
            </ButtonLink>
          </div>
        )}
      </section>

      {nextEvent ? (
        <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
          <section
            aria-label={calendarModule?.title ?? "นัดถัดไป"}
            className={styles.moment}
          >
            <div className={styles.momentCopy}>
              <h2 className={styles.momentTitle}>{nextEvent.title}</h2>
              <p className={styles.momentMeta}>
                {formatThaiCalendarPanelDate(nextEvent.event_date)}
                {eventCount > 1 ? ` · อีก ${eventCount - 1} นัด` : null}
              </p>
            </div>
            <ButtonLink
              href={`${calendarHref}?month=${nextEvent.event_date.slice(0, 7)}`}
              variant="primary"
            >
              ไปปฏิทิน
            </ButtonLink>
          </section>
        </LivingCard>
      ) : null}

      <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
        <section
          aria-label={membersModule?.title ?? "คนในห้อง"}
          className={styles.people}
        >
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            {membersModule?.title ?? "คนในห้อง"} · {members.length}
          </h2>
          <Link className={styles.more} href={membersHref} prefetch>
            ดูทั้งหมด
          </Link>
        </div>
        {previewMembers.length > 0 ? (
          <ul className={styles.faces}>
            {previewMembers.map((member) => (
              <li key={member.userId}>
                <Link className={styles.person} href={membersHref} prefetch>
                  <span className={styles.personAvatar} aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      src={member.avatarUrl || getDefaultImageUrl("profile")}
                    />
                  </span>
                  <span className={styles.personName}>{member.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>ยังไม่มีรายชื่อสมาชิกให้แสดง</p>
        )}
        <RemainderLink
          action="ดูทั้งหมด"
          href={membersHref}
          shown={previewMembers.length}
          total={members.length}
          unit="คน"
        />
        {isOwner ? (
          <div className={styles.invite}>
            <ButtonLink
              href={inviteHref}
              variant={lampOnInvite ? "primary" : "default"}
            >
              เชิญคนเข้ามา
            </ButtonLink>
          </div>
        ) : null}
        </section>
      </LivingCard>

      <div className={styles.row}>
        {boardItems.length > 0 ? (
          <Shelf
            actionHref={boardHref}
            actionLabel="ไปบอร์ด"
            emptyAction="เปิดบอร์ด"
            emptyCopy="ยังไม่มีโน้ตหรือโพล ไปเขียนอะไรสั้นๆ ให้ห้องนี้ได้"
            glowRgb={glowRgb}
            label={boardModule?.title ?? "บนบอร์ด"}
            title={boardModule?.title ?? "บนบอร์ด"}
          >
            <ul className={styles.list}>
              {boardItems.map((item) => (
                <li key={item.id}>
                  <Link className={styles.item} href={boardHref} prefetch>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemMeta}>
                      {BOARD_TYPE_LABEL[item.item_type]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <RemainderLink
              action="ไปบอร์ด"
              href={boardHref}
              shown={boardItems.length}
              total={boardCount}
              unit="รายการ"
            />
          </Shelf>
        ) : (
          <Shelf
            actionHref={boardHref}
            actionLabel="ไปบอร์ด"
            emptyAction="เปิดบอร์ด"
            emptyCopy="ยังไม่มีโน้ตหรือโพล ไปเขียนอะไรสั้นๆ ให้ห้องนี้ได้"
            glowRgb={glowRgb}
            label={boardModule?.title ?? "บนบอร์ด"}
            title={boardModule?.title ?? "บนบอร์ด"}
          />
        )}

        {places.length > 0 ? (
          <Shelf
            actionHref={mapHref}
            actionLabel="ไปแผนที่"
            emptyAction="เปิดแผนที่"
            emptyCopy="ยังไม่มีหมุดในแผนที่ ปักร้านโปรดหรือที่เที่ยวไว้ได้"
            glowRgb={glowRgb}
            label={mapModule?.title ?? "สถานที่"}
            title={mapModule?.title ?? "สถานที่"}
          >
            <ul className={styles.list}>
              {places.map((place) => (
                <li key={place.id}>
                  <Link className={styles.item} href={mapHref} prefetch>
                    <span className={styles.itemTitle}>{place.name}</span>
                    <span className={styles.itemMeta}>
                      {formatPlaceDate(place.place_date) ?? "ยังไม่ระบุวันที่"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <RemainderLink
              action="ไปแผนที่"
              href={mapHref}
              shown={places.length}
              total={placeCount}
              unit="หมุด"
            />
          </Shelf>
        ) : (
          <Shelf
            actionHref={mapHref}
            actionLabel="ไปแผนที่"
            emptyAction="เปิดแผนที่"
            emptyCopy="ยังไม่มีหมุดในแผนที่ ปักร้านโปรดหรือที่เที่ยวไว้ได้"
            glowRgb={glowRgb}
            label={mapModule?.title ?? "สถานที่"}
            title={mapModule?.title ?? "สถานที่"}
          />
        )}
      </div>
    </LivingStage>
  );
}
