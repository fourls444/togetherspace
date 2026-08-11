# TogetherSpace Phase 2 Board MVP Plan

## เป้าหมาย

เริ่ม Phase 2 ด้วยงานที่ต่อจาก Phase 1 ได้ทันที: invite link preview แบบ Discord และ Board MVP สำหรับ note, checklist และ poll ภายในแต่ละห้อง

## ทำแล้วในรอบนี้

### 1. Invite Link Preview

- [x] คง Join Room ด้วย Room Code 6 ตัว
- [x] ให้ Invite Link ใช้ `invite_token` เป็นลิงก์หลัก
- [x] เพิ่ม RPC `preview_room_invite` เพื่อให้คนที่ยังไม่เป็นสมาชิกเห็นข้อมูล preview ได้โดยไม่เปิด RLS กว้างเกินไป
- [x] แสดงชื่อห้อง ประเภทห้อง รูปห้อง และจำนวนสมาชิกก่อนกดเข้าร่วม
- [x] แยกข้อความกรณี invite ไม่พบ หมดอายุ ถูกยกเลิก หรือใช้งานครบ

### 2. Board Schema

- [x] เพิ่มตาราง `boards`
- [x] เพิ่มตาราง `board_items` สำหรับ item กลางประเภท `note`, `checklist`, `poll`
- [x] เพิ่มตารางย่อย `board_checklist_items`
- [x] เพิ่มตารางย่อย `board_poll_options`
- [x] เพิ่มตาราง vote `board_poll_votes`
- [x] เพิ่ม setting ของ poll ใน `board_items`
  - `poll_max_votes_per_user`
  - `poll_allow_vote_cancel` เก็บไว้เพื่อรองรับข้อมูลเดิม แต่ระบบปัจจุบันให้ยกเลิกโหวตได้เสมอ
- [x] เพิ่ม RLS ให้สมาชิกห้องเท่านั้นอ่านและสร้างข้อมูล board ได้
- [x] เพิ่ม RPC `ensure_room_board` เพื่อสร้างบอร์ดหลักของห้องอัตโนมัติเมื่อเปิดครั้งแรก

### 3. Board UI MVP

- [x] เพิ่ม route `/rooms/[roomId]/board`
- [x] เพิ่มปุ่มไปหน้า Board จากหน้า Room Detail
- [x] เปลี่ยน note/checklist/poll เป็นปุ่มเล็กบนหน้าบอร์ด
- [x] กดปุ่มเพิ่ม item แล้วเปิด modal ตามประเภทที่เลือก
- [x] เพิ่ม note ได้
- [x] เพิ่ม checklist ได้จาก textarea หนึ่งบรรทัดต่อหนึ่งรายการ
- [x] Toggle checklist ได้ทั้งทำเสร็จและยกเลิก
- [x] เพิ่ม poll ได้จาก textarea หนึ่งบรรทัดต่อหนึ่งตัวเลือก
- [x] ตั้งค่า poll ได้ 2 โหมด: โหวตได้ข้อเดียว หรือโหวตได้หลายข้อ
- [x] ยกเลิก vote ได้เสมอโดยไม่ต้องมีปุ่มตั้งค่าแยก
- [x] แก้ไข card/checklist item/poll option เบื้องต้นได้
- [x] Archive board item แทนการลบจริง

### 4. Board Management หลัง MVP

- [x] เพิ่มและลบ checklist item ภายหลังได้
- [x] เพิ่มและลบ poll option โดยคงอย่างน้อย 2 ตัวเลือก
- [x] สลับโหมดโหวตข้อเดียว/หลายข้อ และยกเลิกโหวตได้เสมอ
- [x] แสดงผลสำเร็จหรือข้อผิดพลาดด้วย toast
- [x] เปลี่ยน native confirm เป็น dialog กลางที่เข้าถึงด้วยคีย์บอร์ดได้
- [x] เก็บรายการแบบ soft archive โดยยังไม่มีหน้ากู้คืนหรือลบถาวร

## ยังไม่รวมในรอบนี้

- Drag and drop
- Realtime
- Board หลายอันต่อหนึ่งห้อง
- UI ตาม Figma แบบสมบูรณ์
- Permission แยกระดับละเอียดสำหรับ Board
