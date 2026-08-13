# Crop, Board Copy, and Responsive Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับหน้าครอปรูปให้เห็นภาพส่วนเกินแบบเครื่องมือครอป และทำให้บอร์ดมีข้อความ/คำแนะนำที่เข้ากับประเภทห้องมากขึ้น พร้อมตรวจ responsive และ library ที่ควรใช้ต่อ

**Architecture:** เก็บพฤติกรรมอัปโหลดเดิมไว้ใน `ImageUploadField` แต่เปลี่ยน preview layer เป็นภาพจริงด้านหลัง + mask วงกลม/กรอบครอปด้านหน้า ส่วนบอร์ดเพิ่ม helper copy แยกตาม `RoomType` เพื่อไม่กระจายข้อความไว้ในหลาย component และไม่แตะ schema/RLS/RPC

**Tech Stack:** Next.js App Router, React, CSS Modules, Supabase client/server helpers, Node test runner

---

### Task 1: Board Copy Catalog

**Files:**
- Create: `src/lib/boards/board-copy.ts`
- Create: `src/lib/boards/board-copy.test.ts`
- Modify: `src/app/(app)/rooms/[roomId]/board/page.tsx`
- Modify: `src/components/boards/board-create-forms.tsx`
- Modify: `src/components/boards/board-item-list.tsx`

- [ ] Write tests for friend/couple/family board copy titles, actions, placeholders, and suggestion counts.
- [ ] Run the board copy test and confirm it fails because the helper does not exist yet.
- [ ] Add `getBoardCopy(type)` with labels for note/checklist/poll, modal copy, placeholders, empty state, and three starter suggestions per room type.
- [ ] Pass `context.room.type` from the board route into create/list components.
- [ ] Replace generic board text with copy from `getBoardCopy`.
- [ ] Run the board copy test and board interaction tests.

### Task 2: Cropper Visual Redesign

**Files:**
- Modify: `src/components/uploads/image-upload-field.tsx`
- Modify: `src/components/uploads/image-upload-field.module.css`
- Test: `src/lib/uploads/crop-position.test.ts`

- [ ] Keep current direct drag, pinch, wheel, keyboard, reset, cancel, save behavior.
- [ ] Add a visible background image layer behind the crop preview.
- [ ] Keep the actual saved preview drawn by canvas.
- [ ] Add a mask overlay so the crop area is clear, with a circle for profile/roomProfile and rounded square for room images.
- [ ] Move zoom/reset/cancel/save controls into a compact right column on desktop and bottom controls on mobile.
- [ ] Run crop helper tests.

### Task 3: Responsive and Library Audit

**Files:**
- Inspect: `src/components/**/*.module.css`
- Inspect: `src/app/**/*.module.css`
- Inspect: `package.json`

- [ ] Check board, crop, modal, album, calendar, map, finance, settings, profile, create room, and room home responsive rules for obvious overflow risks.
- [ ] Fix scoped CSS issues introduced by this round.
- [ ] Prepare a short library recommendation list focused on cropper, board drag/layout, virtualization, form state, data fetching, and responsive testing.
- [ ] Run lint, typecheck, targeted tests, and build unless the user explicitly asks to skip a command.
