import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CalendarDays, ClipboardList, Images, MapPinned, Users, WalletCards } from "lucide-react";

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
  ROOM_TYPE_THEME,
} from "@/lib/rooms/labels";
import { sortRoomMembers } from "@/lib/rooms/member-sort";
import { getRoomPath, getRoomSubPath } from "@/lib/rooms/room-path";
import { getRoomContext } from "@/lib/rooms/server";
import type { BoardItemType } from "@/lib/types/database";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
import { formatBaht } from "@/lib/finance/summary";

const BOARD_TYPE_LABEL: Record<BoardItemType, string> = {
  note: "โน้ต",
  checklist: "เช็คลิสต์",
  poll: "โพล",
};

const PLACE_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const PREVIEW_LIMIT = 3;
const MINI_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function MiniCalendar({
  todayKey,
  markedDates,
}: {
  todayKey: string;
  markedDates: string[];
}) {
  const [year, month] = todayKey.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );
  const markedSet = new Set(markedDates);

  return (
    <div className={styles.miniCalendar} aria-label={`ปฏิทินเดือน${monthLabel}`}>
      <div className={styles.miniCalendarHead}>
        <strong>{monthLabel}</strong>
      </div>
      <div className={styles.miniWeekdays} aria-hidden="true">
        {MINI_WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className={styles.miniDays}>
        {cells.map((day, index) => {
          if (!day) return <span aria-hidden="true" className={styles.miniDayEmpty} key={`empty-${index}`} />;
          const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const stateClass = `${dateKey === todayKey ? ` ${styles.miniDayToday}` : ""}${markedSet.has(dateKey) ? ` ${styles.miniDayEvent}` : ""}`;
          return <span className={`${styles.miniDay}${stateClass}`} key={dateKey}>{day}</span>;
        })}
      </div>
    </div>
  );
}

function formatPlaceDate(date: string | null) {
  if (!date) return null;
  return PLACE_DATE_FORMATTER.format(new Date(`${date}T00:00:00.000Z`));
}

function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <h2 className={styles.sectionTitle}><span className={styles.sectionIcon} aria-hidden>{icon}</span>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
      </div>
    </div>
  );
}

function EmptySlot({
  icon,
  copy,
}: {
  icon: string;
  copy: string;
}) {
  return (
    <div className={styles.emptySlot}>
      <span className={styles.emptyIcon} aria-hidden>{icon}</span>
      <p className={styles.emptyCopy}>{copy}</p>
    </div>
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
  const roomImage = room.avatar_url || getDefaultImageUrl("room");
  const todayKey = formatDateKey(new Date());
  const albumHref = getRoomSubPath(roomCode, "album");
  const boardHref = getRoomSubPath(roomCode, "board");
  const calendarHref = getRoomSubPath(roomCode, "calendar");
  const mapHref = getRoomSubPath(roomCode, "map");
  const financeHref = getRoomSubPath(roomCode, "finance");
  const membersHref = getRoomSubPath(roomCode, "members");
  const modules = getRoomHomeModules(room.type);
  const albumModule = modules.find((module) => module.key === "album");
  const boardModule = modules.find((module) => module.key === "board");
  const calendarModule = modules.find((module) => module.key === "calendar");
  const mapModule = modules.find((module) => module.key === "map");
  const membersModule = modules.find((module) => module.key === "members");
  const financeModule = modules.find((module) => module.key === "finance");

  const [
    membershipsResult,
    roomProfilesResult,
    boardResult,
    eventsResult,
    photosResult,
    placesResult,
    financeExpensesResult,
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
      .limit(PREVIEW_LIMIT),
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
    supabase
      .from("finance_expenses")
      .select("id, title, amount_cents, expense_date", { count: "exact" })
      .eq("room_id", roomId)
      .order("expense_date", { ascending: false })
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
        .limit(20)
    : {
        count: 0,
        data: [] as { id: string; item_type: BoardItemType; title: string }[],
      };

  const memberships = membershipsResult.data ?? [];
  const roomProfiles = new Map(
    (roomProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]),
  );
  const members = sortRoomMembers(memberships.map((membership) => {
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
  }), currentUserId);
  const photos = photosResult.data ?? [];
  const events = eventsResult.data ?? [];
  const boardItems = boardItemsResult.data ?? [];

  const polls = boardItems.filter(i => i.item_type === "poll");
  const checklists = boardItems.filter(i => i.item_type === "checklist");
  const notes = boardItems.filter(i => i.item_type === "note");
  const places = placesResult.data ?? [];
  const financeExpenses = financeExpensesResult.data ?? [];
  const previewMembers = members.slice(0, PREVIEW_LIMIT);
  const glowRgb = ROOM_TYPE_THEME[room.type].sparkRgb;
  const markedDates = events.map((e) => e.event_date);

  return (
    <LivingStage
      className={styles.home}
      glowRgb={glowRgb}
      spotlight={false}
      style={
        {
          "--room-accent": ROOM_TYPE_THEME[room.type].accent,
        } as CSSProperties
      }
    >
      {/* ── Header ── */}
      <header className={styles.head}>
          <div className={styles.headIdentity}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.roomImage} src={roomImage} alt="" />
            <div className={styles.headCopy}>
            <h1 className={styles.title}>{room.name}</h1>
            </div>
          </div>
        <div className={styles.roomStats} aria-label="ข้อมูลย่อของห้อง">
          <div className={styles.statBox}>
            <span>สมาชิก</span>
            <strong>{members.length} คน</strong>
          </div>
          <RoomCodeCopy className={styles.codeBox} roomCode={roomCode} />
        </div>
      </header>

      {/* ── 2-col grid: Album + (Calendar & Board) ── */}
      <div className={styles.twoCol}>

        {/* Album */}
        <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
          <Link href={albumHref} className={styles.cardLink} prefetch>
            <section aria-label={albumModule?.title ?? "รูปล่าสุด"} className={styles.wall}>
              <div className={styles.wallHead}>
                <div>
                  <h2 className={styles.sectionTitle}><span className={styles.sectionIcon} aria-hidden><Images size={20} /></span>{albumModule?.title ?? "อัลบั้ม"}</h2>
                  {albumModule?.description ? <p className={styles.sectionDescription}>{albumModule.description}</p> : null}
                </div>
              </div>
            {photos.length > 0 ? (
              <RoomPhotoWall albumHref={albumHref} photos={photos} />
            ) : (
              <EmptySlot
                icon="🖼️"
                copy="ยังไม่มีรูปในอัลบั้ม เริ่มจากโมเมนต์แรกของห้องนี้ได้เลย"
              />
            )}
          </section>
          </Link>
        </LivingCard>

        <div className={styles.colStack}>
          {/* Calendar */}
          <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
            <Link href={calendarHref} className={styles.cardLink} prefetch>
              <section aria-label={calendarModule?.title ?? "ปฏิทิน"} className={`${styles.section} ${styles.calendarSection}`}>
                <SectionHeader icon={<CalendarDays size={20} />} title={calendarModule?.title ?? "ปฏิทิน"} description={calendarModule?.description} />
                <div className={styles.calendarLayout}>
                  <MiniCalendar todayKey={todayKey} markedDates={markedDates} />
                  {events.length > 0 ? (
                    <ul className={styles.eventList}>
                      {events.map((event) => (
                        <li key={event.id}>
                          <div className={styles.eventItem}>
                            <span className={styles.eventDot} aria-hidden />
                            <span className={styles.eventTitle}>{event.title}</span>
                            <span className={styles.eventDate}>{formatThaiCalendarPanelDate(event.event_date)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.calendarEmpty}>
                      <span className={styles.calendarEmptyIcon} aria-hidden>○</span>
                      <div>
                        <p className={styles.calendarEmptyTitle}>ยังไม่มีนัดหมาย</p>
                        <p className={styles.emptyCopy}>เพิ่มกิจกรรมแรกของห้องนี้ได้เลย</p>
                      </div>
                    </div>
                  )}
              </div>
            </section>
          </Link>
          </LivingCard>

          {/* Board */}
          <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
            <Link href={boardHref} className={styles.cardLink} prefetch>
              <section aria-label={boardModule?.title ?? "บอร์ด"} className={styles.section}>
                <SectionHeader icon={<ClipboardList size={20} />} title={boardModule?.title ?? "บอร์ด"} description={boardModule?.description} />
                {boardItems.length > 0 ? (
                  <>
                    <ul className={styles.list}>
                      {(["poll", "checklist", "note"] as BoardItemType[]).map((type) => {
                        const itemsOfType = type === "poll" ? polls : type === "checklist" ? checklists : notes;
                        return (
                          <li key={type}>
                            <div className={styles.item}>
                              <span className={styles.boardTag} data-type={type}>
                                {BOARD_TYPE_LABEL[type]}
                              </span>
                              <span className={styles.itemDetail}>
                                {itemsOfType.length > 0
                                  ? itemsOfType.map((i) => i.title).join(", ")
                                  : "-"}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
              ) : (
                <EmptySlot
                  icon="📋"
                  copy="ยังไม่มีโน้ตหรือโพล ไปเขียนอะไรสั้นๆ ให้ห้องนี้ได้"
                />
              )}
            </section>
          </Link>
        </LivingCard>
        </div>
      </div>

      {/* ── 3-col grid: Places + Finance + Members ── */}
      <div className={styles.bottomGrid}>

        {/* Places */}
        <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
          <Link href={mapHref} className={styles.cardLink} prefetch>
            <section aria-label={mapModule?.title ?? "สถานที่"} className={styles.section}>
              <SectionHeader icon={<MapPinned size={20} />} title={mapModule?.title ?? "สถานที่"} description={mapModule?.description} />
              {places.length > 0 ? (
                <>
                  <ul className={styles.list}>
                    {places.map((place) => (
                      <li key={place.id}>
                        <div className={styles.item}>
                          <span className={styles.itemTitle}>{place.name}</span>
                          <span className={styles.itemMeta}>
                            {formatPlaceDate(place.place_date) ?? "ยังไม่ระบุวันที่"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
            ) : (
              <EmptySlot
                icon="📍"
                copy="ยังไม่มีหมุดในแผนที่ ปักร้านโปรดหรือที่เที่ยวไว้ได้"
              />
            )}
          </section>
          </Link>
        </LivingCard>

      {/* Finance */}
        <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
          <Link href={financeHref} className={styles.cardLink} prefetch>
            <section aria-label={financeModule?.title ?? "การเงิน"} className={styles.section}>
              <SectionHeader icon={<WalletCards size={20} />} title={financeModule?.title ?? "การเงิน"} description={financeModule?.description} />
              {financeExpenses.length > 0 ? (
                <>
                  <ul className={styles.list}>
                    {financeExpenses.map((expense) => (
                      <li key={expense.id}>
                        <div className={styles.item}>
                          <span className={styles.itemTitle}>{expense.title}</span>
                          <span className={styles.itemMeta}>
                            {formatBaht(expense.amount_cents)}
                            {expense.expense_date ? ` · ${new Intl.DateTimeFormat("th-TH", { dateStyle: "short" }).format(new Date(`${expense.expense_date}T00:00:00.000Z`))}` : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
            ) : (
              <EmptySlot
                icon="💰"
                copy="ยังไม่มีรายการค่าใช้จ่าย เริ่มบันทึกรายการแรกได้เลย"
              />
            )}
          </section>
          </Link>
        </LivingCard>

        {/* Members (Small box) */}
        <LivingCard className={styles.liveShelf} glowRgb={glowRgb}>
          <Link href={membersHref} className={styles.cardLink} prefetch>
            <section
              aria-label={membersModule?.title ?? "สมาชิกในห้อง"}
              className={styles.section}
            >
              <SectionHeader icon={<Users size={20} />} title={membersModule?.title ?? "สมาชิก"} description={membersModule?.description} />
              {previewMembers.length > 0 ? (
                <ul className={styles.faces}>
                  {previewMembers.map((member) => (
                    <li key={member.userId}>
                      <div className={styles.person}>
                        <span className={styles.personAvatar} aria-hidden>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt=""
                            src={member.avatarUrl || getDefaultImageUrl("profile")}
                          />
                        </span>
                        <span className={styles.personName}>{member.displayName}</span>
                      </div>
                    </li>
                  ))}
                  {members.length > previewMembers.length && (
                    <li>
                      <span className={styles.moreFaces}>
                        +{members.length - previewMembers.length}
                      </span>
                    </li>
                  )}
                </ul>
              ) : (
                <p className={styles.emptyCopy}>ยังไม่มีรายชื่อสมาชิกให้แสดง</p>
              )}
            </section>
          </Link>
        </LivingCard>
      </div>
    </LivingStage>
  );
}
