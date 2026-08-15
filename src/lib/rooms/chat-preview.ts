type RoomChatPreviewInput = {
  body: string;
  currentUserId: string;
  senderName: string;
  userId: string;
};

/** จัดข้อความย่อบนปุ่มแชทให้เห็นว่าใครเป็นผู้ส่งข้อความล่าสุด */
export function formatRoomChatPreview({
  body,
  currentUserId,
  senderName,
  userId,
}: RoomChatPreviewInput) {
  const sender = userId === currentUserId ? "คุณ" : senderName;
  return `${sender}: ${body}`;
}
