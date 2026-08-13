type RoomChatKeyboardInput = {
  isComposing?: boolean;
  key: string;
  shiftKey: boolean;
};

/** ตัดสินว่าปุ่มที่กดในช่องแชทควรส่งข้อความทันทีหรือไม่ */
export function shouldSubmitRoomChat(event: RoomChatKeyboardInput) {
  return event.key === "Enter" && !event.shiftKey && !event.isComposing;
}
