# Family Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม Family Tree เฉพาะห้องประเภทครอบครัว พร้อมคนในผังแบบ hybrid, ความสัมพันธ์พื้นฐาน, และการขยับตำแหน่งบนผัง

**Architecture:** เก็บข้อมูลคนในผังแยกจาก profile หลัก โดยผูกกับสมาชิกจริงในห้องได้หรือเป็น guest ได้ ความสัมพันธ์เก็บแยกเป็น edge ระหว่างคนสองคน หน้า UI เป็น client component สำหรับเพิ่ม/แก้/ลบ/ลากตำแหน่ง แล้วใช้ Server Actions บันทึกจริง

**Tech Stack:** Next.js App Router, Server Actions, Supabase, Drizzle schema, Zod, CSS Modules

---

### Task 1: Copy และ Skeleton

**Files:**
- Modify: `src/lib/boards/board-copy.ts`
- Modify: `src/lib/boards/board-copy.test.ts`
- Modify: `src/app/(app)/loading.tsx`
- Modify: `src/app/(app)/loading.module.css`

- [ ] ปรับ label หลักของบอร์ดทุกประเภทให้เป็น `โน้ต`, `โหวต`, `เช็คลิส`
- [ ] ปรับ skeleton loading ให้มี hero, stat cards และ content cards คล้ายหน้าห้องจริง
- [ ] รัน board copy test

### Task 2: Family Tree Data Layer

**Files:**
- Create: `drizzle/0016_family_tree.sql`
- Create: `src/db/schema/family-tree.ts`
- Modify: `src/db/schema/index.ts`
- Modify: `src/lib/types/database.ts`
- Create: `src/features/family-tree/validation.ts`
- Create: `src/features/family-tree/validation.test.ts`
- Create: `src/features/family-tree/actions.ts`

- [ ] เพิ่มตาราง `family_tree_people` และ `family_tree_relationships`
- [ ] เพิ่ม RLS ให้สมาชิกห้อง family เท่านั้นอ่าน/เขียนได้
- [ ] เพิ่ม validation สำหรับสร้าง/แก้คน, ขยับตำแหน่ง, เพิ่ม/ลบความสัมพันธ์
- [ ] เพิ่ม Server Actions สำหรับ CRUD รอบแรก

### Task 3: Family Tree UI

**Files:**
- Create: `src/app/(app)/rooms/[roomId]/family-tree/page.tsx`
- Create: `src/app/(app)/rooms/[roomId]/family-tree/family-tree-client.tsx`
- Create: `src/app/(app)/rooms/[roomId]/family-tree/family-tree.module.css`
- Modify: `src/app/(app)/rooms/[roomId]/layout.tsx`
- Modify: `src/lib/rooms/labels.ts`

- [ ] เพิ่มเมนู Family Tree เฉพาะห้อง `family`
- [ ] หน้า family/couple/friend ที่ไม่ใช่ family ต้องขึ้นข้อความว่าใช้ได้เฉพาะห้องครอบครัว
- [ ] แสดง card คนในผัง, เส้น parent-child และ sibling, form เพิ่ม/แก้/ลบ
- [ ] ทำ drag เพื่อขยับตำแหน่งและบันทึกตำแหน่ง
- [ ] รัน typecheck/lint
