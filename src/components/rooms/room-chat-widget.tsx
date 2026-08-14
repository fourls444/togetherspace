"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { sendRoomMessage } from "@/features/chat/actions";
import { shouldSubmitRoomChat } from "@/lib/chat/keyboard";
import { mergeRoomChatMessages } from "@/lib/chat/messages";
import {
  collectRoomChatMessageIds,
  countNewUnreadMessages,
} from "@/lib/chat/unread";
import { createClient } from "@/lib/supabase/client";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
import styles from "@/components/rooms/room-chat-widget.module.css";

export type RoomChatMessage = {
  body: string;
  createdAt: string;
  id: string;
  senderAvatarUrl: string;
  senderName: string;
  senderUsername: string;
  userId: string;
};

type RoomChatWidgetProps = {
  currentUserId: string;
  initialMessages: RoomChatMessage[];
  roomAvatarUrl: string;
  roomCode: string;
  roomId: string;
  roomName: string;
};

type RealtimeRoomMessage = {
  body: string;
  created_at: string;
  id: string;
  room_id: string;
  user_id: string;
};

type RoomChatClient = ReturnType<typeof createClient>;

/** แสดงเวลาแบบสั้นเพื่อให้กล่องแชทอ่านง่ายเหมือนแชทลอยมุมจอ */
function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** ปรับความสูงช่องพิมพ์ให้พอดีกับข้อความ และค่อยขยายเมื่อขึ้นบรรทัดใหม่ */
function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 118)}px`;
}

/** ดึงข้อความล่าสุดจากฐานข้อมูล ใช้เป็น fallback เมื่อ realtime ของ Supabase ยังไม่ส่ง event มา */
async function fetchLatestRoomMessages(
  supabase: RoomChatClient,
  roomId: string,
): Promise<RoomChatMessage[]> {
  const { data: rows } = await supabase
    .from("room_messages")
    .select("id, user_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(50);

  const messages = [...(rows ?? [])].reverse();
  const userIds = [...new Set(messages.map((message) => message.user_id))];

  if (userIds.length === 0) return [];

  const [profileResult, roomProfileResult] = await Promise.all([
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
    (profileResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const roomProfiles = new Map(
    (roomProfileResult.data ?? []).map((profile) => [
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

export function RoomChatWidget({
  currentUserId,
  initialMessages,
  roomAvatarUrl,
  roomCode,
  roomId,
  roomName,
}: RoomChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seenMessageIdsRef = useRef(collectRoomChatMessageIds(initialMessages));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const latestMessage = messages.at(-1);
  const roomImage = roomAvatarUrl || getDefaultImageUrl("room");

  useEffect(() => {
    if (!isOpen) return;
    seenMessageIdsRef.current = collectRoomChatMessageIds(messages);
    listRef.current?.scrollTo({
      behavior: "smooth",
      top: listRef.current.scrollHeight,
    });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(() => textareaRef.current?.focus(), 80);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room-chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `room_id=eq.${roomId}`,
          schema: "public",
          table: "room_messages",
        },
        async ({ new: inserted }) => {
          const row = inserted as RealtimeRoomMessage;
          const [profileResult, roomProfileResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("username, display_name, avatar_url")
              .eq("id", row.user_id)
              .maybeSingle(),
            supabase
              .from("room_profiles")
              .select("display_name, avatar_url")
              .eq("room_id", roomId)
              .eq("user_id", row.user_id)
              .maybeSingle(),
          ]);

          const profile = profileResult.data;
          const roomProfile = roomProfileResult.data;
          const nextMessage: RoomChatMessage = {
            body: row.body,
            createdAt: row.created_at,
            id: row.id,
            senderAvatarUrl:
              roomProfile?.avatar_url ??
              profile?.avatar_url ??
              getDefaultImageUrl("profile"),
            senderName:
              roomProfile?.display_name ??
              profile?.display_name ??
              "สมาชิก",
            senderUsername: profile?.username ?? "member",
            userId: row.user_id,
          };

          if (!isOpen) {
            setUnreadCount(
              (current) =>
                current +
                countNewUnreadMessages({
                  currentUserId,
                  messages: [nextMessage],
                  seenIds: seenMessageIdsRef.current,
                }),
            );
          }
          seenMessageIdsRef.current.add(nextMessage.id);
          setMessages((current) => mergeRoomChatMessages(current, [nextMessage]));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, isOpen, roomId]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const syncMessages = async () => {
      const nextMessages = await fetchLatestRoomMessages(supabase, roomId);
      if (!active) return;
      if (!isOpen) {
        setUnreadCount(
          (current) =>
            current +
            countNewUnreadMessages({
              currentUserId,
              messages: nextMessages,
              seenIds: seenMessageIdsRef.current,
            }),
        );
      }
      for (const message of nextMessages) seenMessageIdsRef.current.add(message.id);
      setMessages((current) => mergeRoomChatMessages(current, nextMessages));
    };

    const intervalId = window.setInterval(syncMessages, isOpen ? 2500 : 6000);
    void syncMessages();

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [currentUserId, isOpen, roomId]);

  const trimmedBody = useMemo(() => body.trim(), [body]);

  /** ส่งข้อความผ่าน Server Action เดิม เพื่อให้ validation และ RLS ทำงานเหมือน backend ปัจจุบัน */
  function submitMessage() {
    if (!trimmedBody || isPending) return;
    setError("");

    const formData = new FormData();
    formData.set("body", trimmedBody);
    formData.set("roomCode", roomCode);
    formData.set("roomId", roomId);

    startTransition(async () => {
      const result = await sendRoomMessage(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.message) {
        setMessages((current) => mergeRoomChatMessages(current, [result.message!]));
      }

      setBody("");
      resizeTextarea(textareaRef.current);
      formRef.current?.reset();
    });
  }

  if (!isOpen) {
    return (
      <button
        aria-expanded="false"
        aria-label={`เปิดแชทของห้อง ${roomName}`}
        className={styles.launcher}
        onClick={() => {
          setIsOpen(true);
          setUnreadCount(0);
        }}
        type="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.launcherImage} src={roomImage} alt="" />
        {unreadCount > 0 ? (
          <span className={styles.unreadBadge} aria-label={`${unreadCount} ข้อความใหม่`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
        <span className={styles.launcherText}>
          <strong>แชท</strong>
          <small>
            {latestMessage ? latestMessage.body : roomName}
          </small>
        </span>
      </button>
    );
  }

  return (
    <section className={styles.panel} aria-label={`แชทของห้อง ${roomName}`}>
      <header className={styles.header}>
        <div className={styles.roomIdentity}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.roomImage} src={roomImage} alt="" />
          <div>
            <h2>แชท</h2>
            <p className={styles.roomLabel}>{roomName}</p>
          </div>
        </div>
        <button
          aria-label="ปิดแชท"
          className={styles.closeButton}
          onClick={() => setIsOpen(false)}
          type="button"
        >
          ×
        </button>
      </header>

      <div className={styles.messages} ref={listRef}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <p>ยังไม่มีข้อความ</p>
            <span>ลองส่งข้อความแรกเพื่อเริ่มคุยกันในห้องนี้</span>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.userId === currentUserId;
            return (
              <article
                className={`${styles.message} ${isMine ? styles.mine : ""}`}
                key={message.id}
              >
                {!isMine ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.avatar}
                    src={message.senderAvatarUrl || getDefaultImageUrl("profile")}
                    alt=""
                  />
                ) : null}
                <div className={styles.bubbleWrap}>
                  {!isMine ? (
                    <p className={styles.senderName}>{message.senderName}</p>
                  ) : null}
                  <div className={styles.bubble}>
                    <p>{message.body}</p>
                    <time dateTime={message.createdAt}>
                      {formatMessageTime(message.createdAt)}
                    </time>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage();
        }}
        ref={formRef}
      >
        <textarea
          aria-label="พิมพ์ข้อความ"
          className={styles.input}
          disabled={isPending}
          onChange={(event) => {
            setBody(event.target.value);
            resizeTextarea(event.currentTarget);
          }}
          onKeyDown={(event) => {
            if (!shouldSubmitRoomChat(event)) return;
            event.preventDefault();
            submitMessage();
          }}
          placeholder="พิมพ์ข้อความ..."
          ref={textareaRef}
          rows={1}
          value={body}
        />
        <button
          aria-label="ส่งข้อความ"
          className={styles.sendButton}
          disabled={!trimmedBody || isPending}
          type="submit"
        >
          ↗
        </button>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
}
