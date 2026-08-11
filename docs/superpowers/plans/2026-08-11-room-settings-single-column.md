# Room Settings Single Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับหน้าตั้งค่าห้องและส่วนเกี่ยวข้องให้กะทัดรัด รองรับสมาชิกจำนวนมาก และวางรหัสห้องในตำแหน่งที่ใช้งานจริง

**Architecture:** ใช้ CSS Modules เดิมและ client-side progressive rendering สำหรับสมาชิกครั้งละ 20 คน ประวัติคำเชิญใช้ native `details` เพื่อไม่เพิ่ม state ที่ไม่จำเป็น และอ่าน `created_by` จาก query เดิมโดยไม่เปลี่ยนฐานข้อมูล

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Node test runner

---

### Task 1: Profile and calendar polish

**Files:**
- Modify: `src/components/uploads/image-upload-field.tsx`
- Modify: `src/app/(app)/profile/profile-form.tsx`
- Modify: `src/app/(app)/profile/profile.module.css`
- Modify: `src/components/calendar/calendar.module.css`

- [x] ซ่อน helper ใต้รูปโปรไฟล์และจำกัดความกว้างช่องชื่อ
- [x] เปลี่ยน marker กิจกรรมเป็นสี่เหลี่ยมมนและล็อกตำแหน่ง

### Task 2: Member progressive rendering

**Files:**
- Create: `src/components/rooms/member-visibility.test.ts`
- Create: `src/components/rooms/member-visibility.ts`
- Modify: `src/components/rooms/member-management.tsx`
- Modify: `src/components/rooms/member-management.module.css`

- [x] เขียนและรัน failing tests สำหรับจำนวนสมาชิกเริ่มต้นและการโหลดเพิ่ม
- [x] แสดงสมาชิกครั้งละ 20 และเพิ่มครั้งละ 20
- [x] จัดสมาชิกเป็นกริดกะทัดรัดพร้อมรูป ชื่อ บทบาท และคำสั่ง

### Task 3: Settings information architecture

**Files:**
- Modify: `src/app/(app)/rooms/[roomId]/settings/page.tsx`
- Modify: `src/app/(app)/rooms/[roomId]/settings/settings.module.css`
- Modify: `src/components/rooms/invite-list.tsx`
- Modify: `src/components/rooms/invite-list.module.css`
- Modify: `src/components/rooms/create-invite-form.tsx`

- [x] เรียง section เป็นโปรไฟล์ ข้อมูลห้อง สมาชิก และออกจากห้อง
- [x] รวมฟอร์มสร้างคำเชิญไว้ในข้อมูลห้อง
- [x] ซ่อนประวัติคำเชิญหลังปุ่ม และแสดงผู้สร้างแต่ละรายการ
- [x] เอา section รหัสเข้าห้องออก

### Task 4: Room header copy action

**Files:**
- Modify: `src/app/(app)/rooms/[roomId]/layout.tsx`
- Modify: `src/components/rooms/room-chrome.module.css`

- [x] เพิ่มปุ่มคัดลอกรหัสในกรอบรหัสห้องบนส่วนหัว

### Task 5: Verification

**Files:**
- Verify only

- [x] รัน test ที่เพิ่มและชุดทดสอบเดิม
- [x] รัน typecheck, ESLint และ production build
- [x] ตรวจ diff ว่าไม่มี backend schema หรือ dependency เปลี่ยน
