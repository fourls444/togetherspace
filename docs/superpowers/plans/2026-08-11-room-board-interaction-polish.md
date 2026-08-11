# Room And Board Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แก้ checklist/poll ให้ตอบสนองเฉพาะจุด และปรับเลย์เอาต์หน้าแรกห้องกับหน้าตั้งค่าให้สมดุล

**Architecture:** แยก pure state reducers สำหรับ checklist/poll เพื่อทดสอบได้ แล้วให้ client component ใช้ optimistic local state พร้อม rollback เมื่อ Server Action ผิดพลาด ส่วนเลย์เอาต์ใช้ CSS Modules และ component คัดลอกรหัสที่เข้าถึงได้

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Zod, Node test runner

---

### Task 1: Checklist boolean regression

**Files:**

- Modify: `src/features/boards/validation.test.ts`
- Modify: `src/features/boards/validation.ts`

- [x] เพิ่ม test ว่า string `false` parse เป็น boolean false
- [x] รัน test และยืนยันว่า fail ด้วยค่า true
- [x] เปลี่ยน schema ให้รับเฉพาะ true/false ที่ถูกต้อง
- [x] รัน test และยืนยันว่า pass

### Task 2: Optimistic board state

**Files:**

- Create: `src/components/boards/board-interaction-state.test.ts`
- Create: `src/components/boards/board-interaction-state.ts`
- Modify: `src/components/boards/board-item-list.tsx`
- Modify: `src/features/boards/actions.ts`

- [x] เพิ่ม tests สำหรับ toggle checklist, poll แบบข้อเดียวและหลายข้อ
- [x] รัน tests และยืนยันว่า fail เพราะ helper ยังไม่มี
- [x] สร้าง pure helpers สำหรับอัปเดตและ rollback state
- [x] รัน tests และยืนยันว่า pass
- [x] เชื่อม local state เข้ากับ checklist/poll และ rollback เมื่อ action ล้มเหลว
- [x] เอา revalidation ออกจาก action toggle/vote เท่านั้น

### Task 3: Room home and copy affordance

**Files:**

- Modify: `src/components/rooms/room-home.module.css`
- Create: `src/components/rooms/room-code-copy.tsx`
- Create: `src/components/rooms/room-code-copy.module.css`
- Modify: `src/app/(app)/rooms/[roomId]/layout.tsx`
- Modify: `src/components/rooms/room-chrome.module.css`

- [x] ตัด margin ซ้ำด้านบนในกรอบสมาชิก
- [x] ทำกรอบรหัสห้องเป็นปุ่มคัดลอกพร้อมสัญลักษณ์และสถานะสำเร็จ
- [x] คงขนาดและตำแหน่งการ์ดจำนวนสมาชิก/รหัสห้องเดิม

### Task 4: Settings split layout

**Files:**

- Modify: `src/app/(app)/rooms/[roomId]/settings/page.tsx`
- Modify: `src/app/(app)/rooms/[roomId]/settings/settings.module.css`

- [x] ห่อสอง section แรกใน grid สองคอลัมน์บนจอกว้าง
- [x] ให้ section สมาชิกและออกจากห้องเต็มความกว้าง
- [x] รักษาคอลัมน์เดียวบนมือถือและสำหรับสมาชิกที่ไม่ใช่เจ้าของ

### Task 5: Verification

**Files:**

- Verify only

- [x] รัน board tests และชุดทดสอบเดิม
- [x] รัน typecheck, ESLint และ production build
- [x] ตรวจ diff ว่าไม่มี dependency หรือ schema เปลี่ยน
