/** ตรวจว่าค่าที่รับมาเป็นรหัสห้องตัวเลข 6 หลักหรือไม่ */
export function isRoomCode(value: string) {
  return /^\d{6}$/.test(value);
}

/** สร้าง path ห้องจาก room code เพื่อไม่ให้ URL แสดง UUID */
export function getRoomPath(roomCode: string) {
  return `/rooms/${roomCode}`;
}

/** สร้าง path ย่อยของห้องจาก room code เช่น members, board หรือ settings */
export function getRoomSubPath(roomCode: string, subPath: string) {
  return `${getRoomPath(roomCode)}/${subPath}`;
}
