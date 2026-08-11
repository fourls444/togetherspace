# UI Consistency Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับหน้าโปรไฟล์ บอร์ด ปฏิทิน อัลบั้ม และปุ่มอันตรายให้ตรงกับข้อกำหนดล่าสุด โดยไม่เปลี่ยน schema, RLS, RPC หรือ Server Action เดิม

**Architecture:** ใช้ CSS Modules และคอมโพเนนต์ UI ที่มีอยู่ เพิ่ม layout prop ให้ช่องอัปโหลดรูปเพื่อใช้โครงแนวตั้งเฉพาะหน้าโปรไฟล์ และเก็บการเปลี่ยนแปลงอื่นเป็นข้อความ/สไตล์เฉพาะโมดูล ปุ่มอันตรายใช้ `ConfirmationDialog` เดิมทั้งหมด

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules

---

### Task 1: Profile editor layouts

**Files:**
- Modify: `src/components/uploads/image-upload-field.tsx`
- Modify: `src/components/uploads/image-upload-field.module.css`
- Modify: `src/app/(app)/profile/profile-form.tsx`
- Modify: `src/app/(app)/profile/profile.module.css`
- Modify: `src/components/rooms/room-profile-form.tsx`
- Create: `src/components/rooms/room-profile-form.module.css`

- [x] เพิ่ม `layout="stacked"` ให้รูปอยู่ซ้าย ปุ่มเปลี่ยนรูปอยู่ใต้รูป และช่องชื่ออยู่ด้านขวา
- [x] ทำ responsive ให้เรียงแนวตั้งบนจอเล็ก
- [x] ทำปุ่มกลับให้มีลูกศรและวางนอกกรอบเนื้อหา

### Task 2: Board labels and modal behavior

**Files:**
- Modify: `src/components/boards/board-create-forms.tsx`
- Modify: `src/components/boards/archive-board-item-button.tsx`

- [x] ปิด modal ได้จากปุ่มปิดเท่านั้นเมื่อคลิกด้วยเมาส์ ส่วน Escape ยังใช้ได้เพื่อ accessibility
- [x] เปลี่ยนข้อความเป็น `จัดเก็บ` และใช้ปุ่มสีหลัก
- [x] เปลี่ยน `จำนวนโหวตต่อคน` เป็น `ตัวเลือกสำหรับโหวต`

### Task 3: Calendar year and monthly list polish

**Files:**
- Modify: `src/app/(app)/rooms/[roomId]/calendar/page.tsx`
- Modify: `src/components/calendar/calendar.module.css`

- [x] เปลี่ยนปุ่มเป็น `กิจกรรมและวันสำคัญเดือนนี้`
- [x] ล็อกปฏิทินรายปีเป็น 3 เดือนต่อแถวบนเดสก์ท็อป
- [x] เรียงจุดกิจกรรมจากบนลงล่างในตำแหน่งคงที่และเว้นจากขอบ

### Task 4: Album density and header

**Files:**
- Modify: `src/app/(app)/rooms/[roomId]/album/page.tsx`
- Modify: `src/components/albums/album.module.css`

- [x] ตัดข้อความ `จัดการอัลบั้ม` และ `เพิ่มรูปใหม่หรือจัดลำดับรูปในแต่ละวัน`
- [x] วางปุ่มอัปโหลดด้านซ้าย
- [x] ลดขนาดขั้นต่ำของช่องรูปเพื่อแสดงรูปได้มากขึ้น โดยยังอ่านง่ายบนมือถือ

### Task 5: Button consistency and destructive actions

**Files:**
- Modify: `src/components/ui/button.module.css`
- Inspect: `src/components/rooms/leave-room-button.tsx`
- Inspect: `src/components/rooms/member-management.tsx`
- Inspect: `src/components/calendar/calendar-event-editor.tsx`
- Inspect: `src/components/albums/album-photo-dialog.tsx`
- Inspect: `src/components/boards/board-item-list.tsx`

- [x] เพิ่มน้ำหนักข้อความปุ่มสีส้มเป็น 700
- [x] ยืนยันว่าปุ่มลบ/ออกจากห้องทุกจุดเปิด `ConfirmationDialog` ก่อนดำเนินการ

### Task 6: Verification

**Files:**
- Verify only

- [x] รันชุดทดสอบ validation และ upload ที่มีอยู่
- [x] รัน `npm run typecheck`
- [x] รัน `npx eslint src`
- [x] รัน `npm run build`
- [x] ตรวจ diff ว่าไม่มี schema, migration, RLS, RPC หรือ dependency ใหม่
