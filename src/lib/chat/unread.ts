export type UnreadMessageIdentity = {
  id: string;
  userId: string;
};

type CountNewUnreadMessagesInput<T extends UnreadMessageIdentity> = {
  currentUserId: string;
  messages: T[];
  seenIds: ReadonlySet<string>;
};

/** นับข้อความใหม่ที่มาจากคนอื่น โดยไม่ให้นับ id เดิมซ้ำจาก realtime และ polling */
export function countNewUnreadMessages<T extends UnreadMessageIdentity>({
  currentUserId,
  messages,
  seenIds,
}: CountNewUnreadMessagesInput<T>) {
  const countedIds = new Set<string>();

  return messages.reduce((count, message) => {
    if (message.userId === currentUserId) return count;
    if (seenIds.has(message.id)) return count;
    if (countedIds.has(message.id)) return count;

    countedIds.add(message.id);
    return count + 1;
  }, 0);
}

/** เก็บ id ข้อความที่เคยเห็นแล้ว เพื่อใช้กัน unread ซ้ำในรอบ sync ถัดไป */
export function collectRoomChatMessageIds<T extends UnreadMessageIdentity>(
  messages: T[],
) {
  return new Set(messages.map((message) => message.id));
}
