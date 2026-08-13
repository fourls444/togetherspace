export type ChatMessageIdentity = {
  createdAt: string;
  id: string;
};

/** รวมข้อความจาก server, action และ realtime โดยกันข้อความซ้ำจาก id เดียวกัน */
export function mergeRoomChatMessages<T extends ChatMessageIdentity>(
  ...groups: T[][]
) {
  const byId = new Map<string, T>();

  for (const group of groups) {
    for (const message of group) byId.set(message.id, message);
  }

  return [...byId.values()].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}
