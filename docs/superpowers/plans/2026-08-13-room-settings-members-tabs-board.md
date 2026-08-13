# Room Settings, Members, Tabs, and Board Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม `@tanstack/react-virtual`, รวมการดูแลสมาชิกไว้ที่หน้าสมาชิก, จัดหน้าตั้งค่าใหม่, ปรับแท็บห้องให้อ่านง่ายขึ้น และต่อยอดบอร์ดด้วย preset ตามประเภทห้องโดยไม่แตะ schema

**Architecture:** ใช้ `MemberManagement` เป็น component เดียวสำหรับการจัดการสมาชิกในหน้า members และเพิ่ม virtual list ภายใน component นั้น ส่วน settings จะคงข้อมูล profile/room/invite/theme/leave room เท่านั้น แท็บห้องปรับด้วย `RoomNav` + CSS เดิม และ board presets ใช้ copy catalog ที่มีอยู่เพื่อเปิด modal พร้อมค่าเริ่มต้น

**Tech Stack:** Next.js App Router, React, CSS Modules, lucide-react, @tanstack/react-virtual, dnd-kit ที่มีอยู่เดิม

---

### Task 1: Dependency and Member Management

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/components/rooms/member-management.tsx`
- Modify: `src/components/rooms/member-management.module.css`
- Modify: `src/app/(app)/rooms/[roomId]/members/page.tsx`

- [ ] Install `@tanstack/react-virtual`.
- [ ] Render `MemberManagement` on the members page when the current user is owner.
- [ ] Keep `MemberList` for non-owner members.
- [ ] Add virtual scrolling inside `MemberManagement` while preserving load-more behavior.

### Task 2: Settings Reflow

**Files:**
- Modify: `src/app/(app)/rooms/[roomId]/settings/page.tsx`
- Modify: `src/app/(app)/rooms/[roomId]/settings/settings.module.css`

- [ ] Remove the member management section from settings.
- [ ] Move leave room under the room profile card on the left.
- [ ] Keep room details and invite management in the right card.
- [ ] Keep theme below the main settings grid.

### Task 3: Room Tabs and Board Presets

**Files:**
- Modify: `src/components/rooms/room-nav.tsx`
- Modify: `src/components/rooms/room-chrome.module.css`
- Modify: `src/components/boards/board-create-forms.tsx`
- Modify: `src/components/boards/board-create-forms.module.css`
- Test: `src/lib/boards/board-copy.test.ts`

- [ ] Add icons and better active states to room tabs.
- [ ] Make tabs horizontally scroll on small screens without wrapping into messy rows.
- [ ] Add starter preset buttons to board create forms using `getBoardCopy(roomType).starterSuggestions`.
- [ ] Clicking a preset opens the matching modal with title/body prefilled.
- [ ] Verify board copy tests still pass.

### Task 4: Verification and Pending Summary

**Files:**
- Inspect: `README.md`, `docs/ROADMAP.md`, `docs/superpowers/plans/*`

- [ ] Run targeted tests, typecheck, lint, and build.
- [ ] Summarize completed work and list user requests that remain pending.
