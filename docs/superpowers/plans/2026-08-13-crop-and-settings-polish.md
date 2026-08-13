# Crop and Settings Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้การครอปรูปลากได้เหมือนเครื่องมือครอปทั่วไป และเก็บ layout ของอัลบั้ม ธีม และหน้าตั้งค่าให้กระชับสม่ำเสมอ

**Architecture:** แยกคณิตศาสตร์การลากและการจำกัดค่าครอปเป็น helper ที่ทดสอบได้ แล้วให้ `ImageUploadField` วาด preview ด้วย canvas ชุดเดียวกับผลครอปจริง งาน layout ใช้ CSS Modules เดิมโดยไม่เพิ่ม dependency

**Tech Stack:** React, TypeScript, Canvas API, Pointer Events, CSS Modules, Node test runner

---

### Task 1: Crop interaction helpers

**Files:**
- Create: `src/lib/uploads/crop-position.ts`
- Create: `src/lib/uploads/crop-position.test.ts`

- [ ] เขียน test ให้การลากแปลงระยะ pointer เป็นค่า offset และจำกัดช่วง `-100..100`
- [ ] รัน `node --experimental-strip-types --test src/lib/uploads/crop-position.test.ts` และยืนยันว่า fail เพราะ helper ยังไม่มี
- [ ] เพิ่ม helper `clampCropOffset` และ `getDraggedCropOffset`
- [ ] รัน test ซ้ำและยืนยันว่า pass

### Task 2: Direct manipulation cropper

**Files:**
- Modify: `src/components/uploads/image-upload-field.tsx`
- Modify: `src/components/uploads/image-upload-field.module.css`

- [ ] ใช้ canvas แสดง preview ให้ตรงกับผลลัพธ์ที่จะอัปโหลด
- [ ] เพิ่ม pointer drag, touch drag, pinch zoom และ wheel zoom
- [ ] เอา slider ซ้าย/ขวาและขึ้น/ลงออก เหลือ slider ซูมกับปุ่มรีเซ็ต
- [ ] จัด crop workspace สองคอลัมน์บน desktop และหนึ่งคอลัมน์บนมือถือ

### Task 3: Album editor alignment

**Files:**
- Modify: `src/components/albums/album-photo-dialog.tsx`
- Modify: `src/components/albums/album.module.css`

- [ ] เปลี่ยนปุ่มปิดเป็นไอคอน X อย่างเดียว
- [ ] จัดวันที่ คำบรรยาย และ action ให้อยู่แถวเดียวบน desktop
- [ ] เปลี่ยนข้อความยืนยันลบเป็น `รูปนี้จะถูกลบออกจากอัลบั้ม และไม่สามารถกู้คืนได้`

### Task 4: Settings layout

**Files:**
- Modify: `src/components/rooms/room-profile-form.tsx`
- Modify: `src/components/rooms/room-profile-form.module.css`
- Modify: `src/components/rooms/room-details-form.module.css`
- Modify: `src/components/rooms/create-invite-form.module.css`
- Modify: `src/app/(app)/rooms/[roomId]/settings/settings.module.css`
- Modify: `src/components/rooms/room-theme.module.css`

- [ ] เอาข้อความช่วยใต้ชื่อที่ใช้ในห้องออก
- [ ] จัดปุ่มบันทึกโปรไฟล์ บันทึกข้อมูลห้อง และสร้างคำเชิญชิดขวา
- [ ] ทำกรอบออกจากห้องกว้างพอดีเนื้อหา
- [ ] ทำธีม 4 แบบอยู่แถวเดียวและเลื่อนแนวนอนบนจอเล็ก

### Task 5: Verification

**Files:**
- Verify only

- [ ] รัน crop helper tests
- [ ] รัน `npm run lint`
- [ ] รัน `npm run typecheck`
- [ ] รัน `npm run build`
- [ ] ตรวจ `git diff --check`
