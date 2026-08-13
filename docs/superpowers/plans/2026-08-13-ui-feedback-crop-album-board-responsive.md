# UI Feedback, Crop, Album, Board และ Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับ Crop, Album, Board, feedback, theme และ responsive ให้ใช้ง่ายและสม่ำเสมอทั้งโปรเจกต์

**Architecture:** ใช้ Modal และ Toast กลางที่มีอยู่เป็นแกน ปรับ component เฉพาะ feature โดยไม่เปลี่ยน data flow หรือ backend แยก pure helpers สำหรับ theme/copy/timing เพื่อทดสอบได้ และใช้ CSS Modules ตามโครงสร้างเดิม

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Lucide React, Node test runner

---

### Task 1: Shared feedback and copy rules

**Files:**
- Modify: `src/components/ui/toast.tsx`
- Modify: `src/components/ui/toast.module.css`
- Modify: forms under `src/app/(app)` and `src/components/rooms`
- Test: `src/components/ui/toast-timing.test.ts`

- [ ] เขียน test ให้ Toast timeout ใช้ค่า 2,500 ms และ reset เมื่อข้อความเปลี่ยน
- [ ] เพิ่ม helper timeout และใช้ใน Toast กลาง
- [ ] เปลี่ยน success message แบบค้างของ Profile, Room Profile และ Room Details เป็น Toast
- [ ] ปรับข้อความไม้ยมกใน UI ที่ค้นพบทั้งหมด

### Task 2: Theme catalog and module copy

**Files:**
- Modify: `src/lib/rooms/themes.ts`
- Modify: `src/lib/rooms/themes.test.ts`
- Modify: `src/lib/rooms/labels.ts`
- Modify: `src/components/rooms/room-home.module.css`

- [ ] เขียน test ให้ทุกประเภทมี 4 ธีมตามลำดับที่กำหนด
- [ ] เพิ่ม Day Trip, Blush Morning และ Sunny Home
- [ ] ปรับคำอธิบายโมดูลให้ไม่เกินสองบรรทัดและไม้ยมกถูกต้อง
- [ ] ล็อกพื้นที่คำอธิบายการ์ดเพื่อให้การ์ดเท่ากัน

### Task 3: Modal and image crop

**Files:**
- Modify: `src/components/ui/modal.tsx`
- Modify: `src/components/ui/modal.module.css`
- Modify: `src/components/uploads/image-upload-field.tsx`
- Modify: `src/components/uploads/image-upload-field.module.css`

- [ ] ปรับ Modal viewport inset, max-height และ internal scroll
- [ ] จัด crop preview และ controls ใหม่ พร้อมไอคอน
- [ ] แยกข้อความสถานะอัปโหลดเป็นหัวข้อและคำอธิบายสองบรรทัด
- [ ] ตรวจ keyboard focus และปุ่มปิด

### Task 4: Album upload and editor

**Files:**
- Modify: `src/components/albums/album-uploader.tsx`
- Modify: `src/components/albums/album-photo-dialog.tsx`
- Modify: `src/components/albums/album.module.css`

- [ ] เพิ่ม preview URL ต่อไฟล์และ cleanup เมื่อเปลี่ยนคิว/unmount
- [ ] แสดง preview grid และปุ่มเอาไฟล์ออกจากคิว
- [ ] จัด modal viewer/editor ไม่ให้ชน Header และรองรับภาพหลายสัดส่วน
- [ ] จัด field วันที่/คำบรรยายและเพิ่ม Trash icon ในปุ่มลบ

### Task 5: Board edit modal

**Files:**
- Modify: `src/components/boards/board-item-list.tsx`
- Modify: `src/components/boards/board-item-list.module.css`
- Modify: `src/app/(app)/rooms/[roomId]/board/board.module.css`
- Test: `src/components/boards/board-interaction-state.test.ts`

- [ ] เพิ่ม test state การเปิด/ปิด editor ตาม item id
- [ ] ย้าย edit form เข้า Modal โดยคง mutation เดิม
- [ ] ลด controls ที่แสดงตลอดเวลาและจัด action group ใหม่
- [ ] ปรับ responsive card/list/modal

### Task 6: Project-wide responsive and icon audit

**Files:**
- Modify: CSS Modules และ action components ที่พบปัญหาเฉพาะจุด

- [ ] ค้นหา fixed width, viewport overflow และ modal/card grid ที่ไม่มี breakpoint
- [ ] เพิ่ม icon เฉพาะ destructive, upload, edit, add, close, back, copy และ save actions ที่ยังไม่มี
- [ ] ตรวจ 360px, 768px และ desktop ด้วย static CSS audit/browser เมื่อเข้าถึง session ได้
- [ ] รัน unit tests, `npm run typecheck`, `npm run lint`, `npm run build` และ `git diff --check`

หมายเหตุ: ไม่ทำ commit อัตโนมัติ เพราะคู่มือโปรเจกต์กำหนดให้ commit เมื่อผู้ใช้สั่งเท่านั้น
