# TogetherSpace Room Modules Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not dispatch subagents for this plan.

**Goal:** ทำให้อัลบั้ม บอร์ด การตั้งค่าห้อง สมาชิก และคำเชิญจัดการได้ครบ พร้อมระบบยืนยันและแจ้งผลที่ใช้ร่วมกัน โดยไม่เชื่อมอัลบั้มกับปฏิทินและไม่อนุญาตให้เปลี่ยนประเภทห้อง

**Architecture:** เพิ่ม controlled confirmation dialog และ toast เป็น UI primitives กลาง จากนั้นปรับ client components ให้เรียก Server Actions ผ่าน transition และรับผลลัพธ์แบบ `{ success, error }`. ใช้ schema และ RLS เดิมทั้งหมด; การเปลี่ยนรูปจะลบไฟล์เก่าหลังฐานข้อมูลบันทึก URL ใหม่สำเร็จเท่านั้น

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Supabase, Zod, dnd-kit, Node test runner

**ข้อจำกัด:** ไม่แก้ schema, migration, RPC หรือ RLS, ไม่เพิ่ม dependency, ไม่ commit/push จนกว่าผู้ใช้จะสั่ง

## สถานะวันที่ 11 สิงหาคม 2026

- ทำโค้ด Task 1–5 และ Task 7 ครบแล้ว
- Task 6 ใช้โครงสร้างข้อความเฉพาะประเภทห้องและ responsive เดิม โดยไม่มี UI เปลี่ยนประเภทห้อง
- Automated tests 37 รายการ, TypeScript และ production build ผ่าน
- ESLint ไม่มี error; เหลือ warning เดิม 8 จุดในเอฟเฟกต์พื้นหลัง
- Owner/member flow และ RLS ต้องตรวจต่อด้วยบัญชี Supabase ที่ล็อกอินจริง
- ไม่มีการแก้ schema, migration, RPC หรือ RLS ในรอบนี้

---

## File Structure

### สร้างใหม่

- `src/components/ui/confirmation-dialog.tsx` — dialog ยืนยันแบบ controlled และจัดการ focus
- `src/components/ui/confirmation-dialog.module.css` — รูปแบบ dialog ที่ผู้ใช้อนุมัติ
- `src/components/ui/toast.tsx` — toast success/error แบบหายเอง
- `src/components/ui/toast.module.css` — สี ตำแหน่ง และ responsive ของ toast
- `src/components/albums/album-photo-dialog.tsx` — ดู แก้ และลบรูปใน modal
- `src/components/rooms/room-details-form.tsx` — แก้ชื่อและรูปห้องโดยไม่มีช่องประเภท
- `src/features/rooms/validation.test.ts` — ทดสอบ validation การแก้ข้อมูลห้อง
- `src/features/boards/validation.test.ts` — ทดสอบคำสั่งจัดการรายการย่อยและ poll

### แก้ไขหลัก

- `src/components/albums/album-photo-grid.tsx`, `album-uploader.tsx`, `album.module.css`
- `src/features/albums/actions.ts`, `validation.ts`, `validation.test.ts`
- `src/components/boards/board-item-list.tsx`, `board-create-forms.tsx`, `archive-board-item-button.tsx`
- `src/components/boards/board-item-list.module.css`, `board-create-forms.module.css`
- `src/features/boards/actions.ts`, `validation.ts`
- `src/app/(app)/rooms/[roomId]/settings/page.tsx`, `settings.module.css`
- `src/features/rooms/actions.ts`, `validation.ts`
- `src/components/rooms/member-management.tsx`, `invite-list.tsx`, `leave-room-button.tsx`
- `src/components/rooms/room-home.module.css`, `room-chrome.module.css`
- `src/components/uploads/image-upload-field.tsx`
- `src/lib/uploads/image-upload.ts`, `image-upload.test.ts`
- `src/components/calendar/calendar-event-editor.tsx`
- `README.md`, `docs/superpowers/plans/2026-08-10-phase-2-board-mvp.md`

---

### Task 1: สร้าง Confirmation Dialog และ Toast กลาง

**Files:**
- Create: `src/components/ui/confirmation-dialog.tsx`
- Create: `src/components/ui/confirmation-dialog.module.css`
- Create: `src/components/ui/toast.tsx`
- Create: `src/components/ui/toast.module.css`

- [ ] **Step 1: สร้าง API ของ dialog แบบ controlled**

```tsx
export type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  variant?: "primary" | "danger";
};
```

ให้ focus ปุ่มยกเลิกเมื่อเปิด, ปิดด้วย Escape/ฉากหลัง, คืน focus ให้ element เดิมเมื่อปิด และใช้ `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`.

- [ ] **Step 2: ทำหน้าตาตามแบบที่อนุมัติ**

หัวข้อกึ่งกลางขนาดประมาณ `1.65rem`, ไม่มีไอคอน, รายละเอียด `max-width: 390px` และ `text-wrap: balance`, ปุ่มสองช่องเท่ากันบนจอปกติและเรียงแนวตั้งบนมือถือ

- [ ] **Step 3: สร้าง Toast ที่ประกาศผลให้ screen reader**

```tsx
export type ToastMessage = {
  id: number;
  message: string;
  tone: "success" | "error";
};
```

ใช้ `role="status"` สำหรับ success, `role="alert"` สำหรับ error และหายเองภายใน 2.6 วินาที

- [ ] **Step 4: ตรวจด้วยคีย์บอร์ด**

ทดสอบเปิด dialog, Tab, Shift+Tab, Escape, คลิกฉากหลัง และตรวจว่า focus กลับปุ่มเดิม

---

### Task 2: ทำอัลบั้มให้แก้ไขและลบได้ครบ

**Files:**
- Modify: `src/features/albums/validation.ts`
- Modify: `src/features/albums/validation.test.ts`
- Modify: `src/features/albums/actions.ts`
- Create: `src/components/albums/album-photo-dialog.tsx`
- Modify: `src/components/albums/album-photo-grid.tsx`
- Modify: `src/components/albums/album-uploader.tsx`
- Modify: `src/components/albums/album.module.css`

- [ ] **Step 1: เพิ่ม failing tests สำหรับแก้ metadata รูป**

```ts
test("แก้วันที่และคำบรรยายรูปได้", () => {
  const result = updateAlbumPhotoSchema.safeParse({
    roomId: "11111111-1111-4111-8111-111111111111",
    roomCode: "123456",
    photoId: "22222222-2222-4222-8222-222222222222",
    caption: "  ทริปทะเล  ",
    takenAt: "2026-08-11",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.caption, "ทริปทะเล");
});
```

- [ ] **Step 2: เพิ่ม `updateAlbumPhotoSchema` และ ActionState มาตรฐาน**

```ts
export type AlbumMutationState = { success?: boolean; error?: string };
export const updateAlbumPhotoSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
  photoId: z.string().uuid(),
  caption: z.string().trim().max(280).transform((value) => value || null),
  takenAt: dateKeySchema,
});
```

ให้ `updateAlbumPhoto`, `deleteAlbumPhoto`, `saveAlbumPhotoOrder` ตรวจสมาชิก/เจ้าของรูปและคืนผลสำเร็จหรือข้อผิดพลาดแทนการเงียบ

- [ ] **Step 3: แยก modal ดูรูปเป็น `AlbumPhotoDialog`**

รองรับปิด, ก่อนหน้า/ถัดไป, แก้วันที่/คำบรรยาย และลบด้วย `ConfirmationDialog`. แสดงคำสั่งจัดการเฉพาะเจ้าของรูปหรือ owner

- [ ] **Step 4: ทำ drag-and-drop แบบ optimistic ที่ย้อนกลับได้**

เก็บ `previousPhotos` ก่อน `setOrderedPhotos`; ถ้า `saveAlbumPhotoOrder` คืน error ให้คืนค่าเดิมและแสดง error toast

- [ ] **Step 5: เพิ่มสถานะอัปโหลดหลายรูป**

เพิ่ม `uploadProgress: { completed: number; total: number } | null`, จำกัด 20 รูปตาม validation เดิม, แสดงชื่อไฟล์/จำนวนไฟล์ และลบไฟล์ที่อัปโหลดสำเร็จแล้วเมื่อไฟล์ถัดไปล้มเหลว

- [ ] **Step 6: รัน validation tests**

Run: `node --test --experimental-strip-types src/features/albums/validation.test.ts`
Expected: tests ทั้งหมดผ่าน

---

### Task 3: ทำบอร์ดให้จัดการรายการได้ครบ

**Files:**
- Create: `src/features/boards/validation.test.ts`
- Modify: `src/features/boards/validation.ts`
- Modify: `src/features/boards/actions.ts`
- Modify: `src/components/boards/board-item-list.tsx`
- Modify: `src/components/boards/archive-board-item-button.tsx`
- Modify: `src/components/boards/board-create-forms.tsx`
- Modify: `src/components/boards/board-item-list.module.css`
- Modify: `src/components/boards/board-create-forms.module.css`

- [ ] **Step 1: เพิ่ม failing tests สำหรับรายการย่อยและการตั้งค่า Poll**

```ts
test("รับข้อมูลระบุตัวเลือก poll ที่ต้องการลบ", () => {
  assert.equal(deletePollOptionSchema.safeParse({
    roomId: ROOM_ID,
    boardItemId: ITEM_ID,
    optionId: OPTION_ID,
  }).success, true);
});
```

เพิ่มกรณีสร้าง/ลบ checklist item, สร้าง/ลบ poll option และแก้ `pollMaxVotesPerUser` เป็น `1` หรือ `2`; จำนวนตัวเลือกคงเหลือต้อง query และตรวจฝั่ง Server Action ห้ามเชื่อค่าจาก client

- [ ] **Step 2: เพิ่ม Server Actions ที่ยังขาด**

เพิ่ม `createChecklistItem`, `deleteChecklistItem`, `createPollOption`, `deletePollOption`, `updatePollSettings`. ทุก action คืน `{ success?: boolean; error?: string }`, revalidate หน้า board และปล่อยให้ RLS ตรวจสิทธิ์จริง

- [ ] **Step 3: เปลี่ยนการแก้ไข card เป็น client interaction ที่แจ้งผลได้**

ใช้ modal/section ที่เปิดปิดชัดเจน, แสดง pending, field error และ toast แทน `<details>` ที่ไม่บอกผลลัพธ์

- [ ] **Step 4: ปรับ Poll และ Checklist**

Checklist ต้องเพิ่ม แก้ ลบ ติ๊ก และยกเลิกได้; Poll ต้องเพิ่ม แก้ ลบตัวเลือก แก้โหมดโหวต แสดงจำนวนคะแนน และยกเลิกคะแนนได้เสมอ

- [ ] **Step 5: เปลี่ยนปุ่มเก็บบอร์ดไปใช้ Dialog ใหม่**

ข้อความยืนยัน: หัวข้อ `เก็บรายการออกจากบอร์ด?`; รายละเอียด `“ชื่อรายการ” จะไม่แสดงบนบอร์ด แต่ข้อมูลยังไม่ถูกลบถาวร`; สำเร็จแล้วแสดง toast และไม่เพิ่มหน้า restore/delete

- [ ] **Step 6: ปรับ card และ empty/error states**

แยก accent ของ note/checklist/poll ด้วยพื้นผิวและ label ไม่ใช้สีฉูดฉาด, รักษา responsive 1 คอลัมน์บนมือถือและ 2 คอลัมน์เมื่อมีพื้นที่

- [ ] **Step 7: รัน validation tests**

Run: `node --test --experimental-strip-types src/features/boards/validation.test.ts`
Expected: tests ทั้งหมดผ่าน

---

### Task 4: แก้ชื่อและรูปห้องโดยล็อกประเภทห้อง

**Files:**
- Modify: `src/features/rooms/validation.ts`
- Create: `src/features/rooms/validation.test.ts`
- Modify: `src/features/rooms/actions.ts`
- Create: `src/components/rooms/room-details-form.tsx`
- Modify: `src/app/(app)/rooms/[roomId]/settings/page.tsx`
- Modify: `src/app/(app)/rooms/[roomId]/settings/settings.module.css`
- Modify: `src/lib/uploads/image-upload.ts`
- Modify: `src/lib/uploads/image-upload.test.ts`
- Modify: `src/components/uploads/image-upload-field.tsx`

- [ ] **Step 1: ทดสอบว่า update schema ไม่มี field ประเภทห้อง**

```ts
test("แก้ชื่อและรูปห้องโดยไม่รับการเปลี่ยนประเภท", () => {
  const result = updateRoomDetailsSchema.safeParse({
    roomId: ROOM_ID,
    roomCode: "123456",
    name: "บ้านของเรา",
    avatarUrl: "",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal("type" in result.data, false);
});
```

- [ ] **Step 2: เพิ่ม `updateRoomDetails`**

ตรวจผู้ใช้, ตรวจว่าเป็น owner, update เฉพาะ `name`, `avatar_url`, `updated_at`, คืน error ที่อ่านง่าย และ revalidate dashboard/room/settings

- [ ] **Step 3: เพิ่มฟอร์มข้อมูลห้อง**

แสดงชื่อ รูป และประเภทแบบ read-only พร้อมข้อความ `ประเภทห้องกำหนดตอนสร้างและไม่สามารถเปลี่ยนได้` โดยไม่มี select/radio สำหรับประเภท

- [ ] **Step 4: ทำ Storage cleanup หลังบันทึกสำเร็จ**

เปลี่ยน `ImageUploadField` ให้ไม่ลบรูปเก่าทันทีหลัง upload; Server Action ต้องอ่าน URL เก่าจากฐานข้อมูลเอง แล้วลบ object เก่าหลัง update ฐานข้อมูลสำเร็จ ห้ามเชื่อ old URL จาก hidden field หากบันทึกล้มเหลวให้ client ลบเฉพาะไฟล์ใหม่ที่ยังไม่ได้ใช้งาน

- [ ] **Step 5: รัน tests**

Run: `node --test --experimental-strip-types src/features/rooms/validation.test.ts src/lib/uploads/image-upload.test.ts`
Expected: tests ทั้งหมดผ่าน

---

### Task 5: ปรับสมาชิก คำเชิญ และการออกจากห้อง

**Files:**
- Modify: `src/components/rooms/member-management.tsx`
- Modify: `src/components/rooms/member-management.module.css`
- Modify: `src/components/rooms/invite-list.tsx`
- Modify: `src/components/rooms/invite-list.module.css`
- Modify: `src/components/rooms/leave-room-button.tsx`
- Modify: `src/components/rooms/create-invite-form.tsx`
- Modify: `src/app/(app)/rooms/[roomId]/members/page.tsx`

- [ ] **Step 1: แทน native confirm ทั้งหมด**

ใช้ `ConfirmationDialog` กับ revoke invite, kick member และ leave room; แสดงชื่อเป้าหมายในรายละเอียดและปิดปุ่มขณะ pending

- [ ] **Step 2: แสดงผล Server Action**

ใช้ toast สำเร็จ/ผิดพลาดกับการเปลี่ยน role, kick, revoke, copy link และ create invite โดยไม่ซ่อน error ในข้อความเล็กด้านบน

- [ ] **Step 3: ทำสถานะคำเชิญให้อ่านง่าย**

ใช้ label `ใช้งานได้`, `หมดอายุ`, `ครบจำนวน`, `ยกเลิกแล้ว`; แสดงจำนวนใช้และวันหมดอายุในกลุ่มข้อมูลเดียวกัน

- [ ] **Step 4: ตรวจ permission UI**

owner เห็นการจัดการทั้งหมด; member เห็นรหัสห้อง โปรไฟล์เฉพาะห้อง และออกจากห้องเท่านั้น

---

### Task 6: ปรับหน้าหลักห้องและ Responsive UX

**Files:**
- Modify: `src/app/(app)/rooms/[roomId]/page.tsx`
- Modify: `src/app/(app)/rooms/[roomId]/layout.tsx`
- Modify: `src/components/rooms/room-home.module.css`
- Modify: `src/components/rooms/room-chrome.module.css`
- Modify: `src/components/rooms/member-list.module.css`
- Modify: `src/lib/rooms/labels.ts`

- [ ] **Step 1: ตรวจข้อความเฉพาะประเภทห้อง**

ให้ friend/couple/family ใช้ชื่อและคำอธิบายของ calendar/album/board ต่างกัน โดยอ่านจาก `getRoomHomeModules(room.type)` และไม่มี UI เปลี่ยนประเภท

- [ ] **Step 2: ปรับ responsive**

ตรวจที่ 360px, 768px, 1024px และ 1440px; header facts ต้องไม่ล้น, nav เลื่อนได้เมื่อแคบ, module cards และ member section เรียงตามพื้นที่

- [ ] **Step 3: เติม empty/loading/error states**

ใช้ข้อความไทยที่บอกสิ่งที่ทำต่อได้ และหลีกเลี่ยงหน้าโล่งหรือ skeleton ที่กระโดดขนาดหลังโหลด

- [ ] **Step 4: ลด render/query ซ้ำที่เห็นชัด**

คง `Promise.all` สำหรับ query อิสระ, หลีกเลี่ยง key ที่สร้างจากข้อมูลทั้งชุดถ้าไม่จำเป็น และ memoize เฉพาะ client list ที่มีต้นทุนจริง

---

### Task 7: ใช้ Dialog กับการลบกิจกรรมปฏิทินโดยไม่เชื่อมอัลบั้ม

**Files:**
- Modify: `src/components/calendar/calendar-event-editor.tsx`
- Modify: `src/components/calendar/calendar.module.css`

- [ ] **Step 1: เปลี่ยน native confirm เป็น Dialog กลาง**

คง flow แก้/ลบกิจกรรมเดิมทั้งหมดและเพิ่ม toast แสดงผล โดยไม่ query รูปและไม่เพิ่มลิงก์ไปอัลบั้ม

- [ ] **Step 2: ทดสอบ regression ของปฏิทิน**

Run: `node --test --experimental-strip-types src/features/calendar/validation.test.ts src/lib/calendar/calendar.test.ts`
Expected: tests ทั้งหมดผ่าน

---

### Task 8: ตรวจระบบจริงและอัปเดตเอกสาร

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-10-phase-2-board-mvp.md`
- Modify: `docs/superpowers/plans/2026-08-11-room-modules-management.md`

- [ ] **Step 1: รัน automated checks**

```powershell
node --test --experimental-strip-types src/features/albums/validation.test.ts src/features/boards/validation.test.ts src/features/rooms/validation.test.ts src/features/calendar/validation.test.ts src/lib/calendar/calendar.test.ts src/lib/uploads/image-upload.test.ts
npm run typecheck
npm run lint
npm run build
```

Expected: tests/typecheck/build ผ่าน; lint ไม่มี error และบันทึก warning เดิมที่ไม่เกี่ยวข้องหากยังมี

- [ ] **Step 2: ทดสอบ owner flow**

แก้ชื่อ/รูปห้อง, สร้างและยกเลิก invite, เปลี่ยน role/kick, จัดการทุกรูป, จัดการ board ทุกชนิด และตรวจ Storage หลังลบ/เปลี่ยนรูป

- [ ] **Step 3: ทดสอบ member flow**

ตรวจว่าแก้รูปคนอื่น/จัดการห้อง/สมาชิกไม่ได้ แต่แก้โปรไฟล์ห้อง จัดการรูปตัวเอง ใช้ checklist/poll และออกจากห้องได้

- [ ] **Step 4: ทดสอบ interaction และ responsive**

ตรวจ focus/Escape/ฉากหลังของ dialog, toast, drag-and-drop ด้วยเมาส์และคีย์บอร์ด รวมถึงจอ 360/768/1024/1440px

- [ ] **Step 5: บันทึกข้อจำกัด Backend**

หาก operation ใดถูก RLS/RPC ปฏิเสธ ให้บันทึกชื่อ operation, error และ policy/RPC ที่ Backend ต้องตรวจ โดยไม่แก้ migration หรือ RLS ในงานนี้

- [ ] **Step 6: อัปเดตเอกสาร**

README ต้องบอกฟีเจอร์ที่ทำงานจริง, bucket ที่ใช้, SQL/RLS ที่ผู้ใช้ต้องเตรียม และสิ่งที่ยังไม่รวม ได้แก่ album-calendar link, board restore/permanent delete, room type editing และ realtime
