# Selective Feature Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** นำฟีเจอร์ที่หายจากการ revert commit `e3961c4` กลับมา โดยรักษา UI แผนที่ อัลบั้ม Theme ห้อง Chat และ Modal รุ่นล่าสุดไว้

**Architecture:** คืนโมดูลอิสระจาก Git blob เดิมแบบตรงไฟล์ แล้วผสานเฉพาะ logic ขนาดเล็กเข้าสู่ไฟล์ UI ปัจจุบัน หลีกเลี่ยงการ revert ทั้ง commit และใช้ tests เดิมจาก `e3961c4` เป็น regression contract

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Supabase, Drizzle ORM, Zod, Node test runner

---

## File map

- Family Tree domain: `src/features/family-tree/`, `src/db/schema/family-tree.ts`, `drizzle/0016_family_tree.sql`
- Family Tree UI: `src/app/(app)/rooms/[roomId]/family-tree/`
- Room navigation: `src/app/(app)/rooms/[roomId]/layout.tsx`, `src/components/effects/line-sidebar/LineSidebar.tsx`
- Room labels/routes: `src/lib/rooms/labels.ts`, `src/app/(app)/rooms/[roomId]/[module]/page.tsx`
- Members: `src/lib/rooms/member-sort.ts`, members page and member management component
- Profile limits: auth and room-profile validation plus their form inputs
- Board/finance copy: `src/lib/boards/board-copy.ts`, `src/lib/finance/summary.ts`
- UI integration: current room chat, loading skeleton and related CSS files

### Task 1: Establish regression tests before restoring implementation

**Files:**
- Restore test: `src/features/family-tree/validation.test.ts`
- Restore test: `src/lib/rooms/labels.test.ts`
- Restore test: `src/lib/validation/auth.test.ts`
- Modify test: `src/lib/boards/board-copy.test.ts`
- Modify test: `src/lib/finance/summary.test.ts`

- [ ] **Step 1: Restore the exact test contracts from `e3961c4`**

Use the versions from commit `e3961c4` for the five test files. The contracts must assert:

```ts
assert.equal(titles.get("board"), "บอร์ด");
assert.equal(titles.get("album"), "อัลบั้ม");
assert.equal(titles.get("map"), "แผนที่");
assert.equal(titles.get("finance"), "บันทึกการเงิน");
assert.equal(titles.get("members"), "สมาชิก");
```

```ts
assert.equal(updateProfileSchema.safeParse({
  displayName: "ก".repeat(41),
  username: "member_01",
  avatarUrl: "",
}).success, false);
```

```ts
assert.equal(formatBaht(123450), "1,234.50 บาท");
```

- [ ] **Step 2: Run the tests and confirm the reverted implementation fails**

Run:

```powershell
node --test --experimental-strip-types src/features/family-tree/validation.test.ts src/lib/rooms/labels.test.ts src/lib/validation/auth.test.ts src/lib/boards/board-copy.test.ts src/lib/finance/summary.test.ts
```

Expected: FAIL because Family Tree files are absent and current labels/profile/finance behavior differs.

### Task 2: Restore the Family Tree domain and database definitions

**Files:**
- Create: `drizzle/0016_family_tree.sql`
- Create: `src/db/schema/family-tree.ts`
- Create: `src/features/family-tree/actions.ts`
- Create: `src/features/family-tree/validation.ts`
- Modify: `src/db/schema/index.ts`
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Restore the four standalone files exactly from `e3961c4`**

Recover the blobs identified by:

```powershell
git show e3961c4:drizzle/0016_family_tree.sql
git show e3961c4:src/db/schema/family-tree.ts
git show e3961c4:src/features/family-tree/actions.ts
git show e3961c4:src/features/family-tree/validation.ts
```

The restored model must expose `familyTreePeople` and `familyTreeRelationships`, allow roles `parent | child | sibling`, and allow relations `parent_child | sibling`.

- [ ] **Step 2: Restore only Family Tree exports and types**

Add to `src/db/schema/index.ts`:

```ts
export * from "./family-tree";
```

Restore the `FamilyTreePerson`, `FamilyTreeRelationship`, role and relationship types from the `e3961c4` version of `src/lib/types/database.ts` without replacing unrelated current types.

- [ ] **Step 3: Run Family Tree validation tests**

Run:

```powershell
node --test --experimental-strip-types src/features/family-tree/validation.test.ts
```

Expected: PASS.

### Task 3: Restore Family Tree pages and connect them to the latest room shell

**Files:**
- Create: `src/app/(app)/rooms/[roomId]/family-tree/page.tsx`
- Create: `src/app/(app)/rooms/[roomId]/family-tree/family-tree-client.tsx`
- Create: `src/app/(app)/rooms/[roomId]/family-tree/family-tree.module.css`
- Modify: `src/app/(app)/rooms/[roomId]/layout.tsx`

- [ ] **Step 1: Restore the three Family Tree page files from `e3961c4`**

Keep their data flow unchanged: the server page verifies room access and room type, loads people/relationships/members, and passes them to the client editor.

- [ ] **Step 2: Add Family Tree to the current navigation without replacing current items**

Import `GitBranch` from `lucide-react`, then append this item after the normal module list and before settings:

```tsx
...(room.type === "family"
  ? [{
      href: getRoomSubPath(roomCode, "family-tree"),
      icon: <GitBranch size={17} />,
      label: "ผังครอบครัว",
    }]
  : []),
```

Do not replace the current icons, room shell, theme provider or settings footer.

- [ ] **Step 3: Verify route visibility**

Run `npm run typecheck`.

Expected: no type error, Family Tree item is generated only when `room.type === "family"`.

### Task 4: Restore neutral module labels and route compatibility

**Files:**
- Restore: `src/app/(app)/rooms/[roomId]/[module]/page.tsx`
- Modify: `src/lib/rooms/labels.ts`
- Test: `src/lib/rooms/labels.test.ts`

- [ ] **Step 1: Restore the dynamic compatibility route from `e3961c4`**

The route must accept known module slugs, redirect to the canonical room-code URL, and return `notFound()` for unsupported values.

- [ ] **Step 2: Merge neutral labels into the current module configuration**

Use these titles for all room types:

```ts
calendar: "ปฏิทิน"
album: "อัลบั้ม"
board: "บอร์ด"
map: "แผนที่"
finance: "บันทึกการเงิน"
members: "สมาชิก"
```

Add the `family-tree` module only to `FAMILY_MODULES`. Preserve all current descriptions and href construction unless the old route is required for compatibility.

- [ ] **Step 3: Run label tests**

Run:

```powershell
node --test --experimental-strip-types src/lib/rooms/labels.test.ts
```

Expected: PASS.

### Task 5: Restore deterministic member ordering and compact-list behavior

**Files:**
- Create: `src/lib/rooms/member-sort.ts`
- Modify: `src/app/(app)/rooms/[roomId]/members/page.tsx`
- Modify: `src/components/rooms/member-management.tsx`
- Modify: `src/components/rooms/member-management.module.css`

- [ ] **Step 1: Restore `sortRoomMembers` from `e3961c4`**

Ordering contract:

```text
owner first -> current user -> Thai locale display name/username
```

- [ ] **Step 2: Apply sorting on the server members page**

Wrap the mapped member array:

```ts
const members: MemberListItem[] = sortRoomMembers(
  memberships.map((membership) => {
    const profile = Array.isArray(membership.profiles)
      ? membership.profiles[0]
      : membership.profiles;
    const roomProfile = roomProfiles.get(membership.user_id);

    return {
      avatarUrl: roomProfile?.avatar_url ?? profile?.avatar_url ?? null,
      userId: membership.user_id,
      displayName:
        roomProfile?.display_name ??
        profile?.display_name ??
        "ไม่พบชื่อสมาชิก",
      username: profile?.username ?? "unknown",
      role: membership.role,
    };
  }),
  currentUserId,
);
```

Change only visible heading/aria text to `สมาชิก`; retain current page card and typography.

- [ ] **Step 3: Use a static list for 20 or fewer members**

Add:

```ts
const shouldVirtualize = visibleMembers.length > MEMBER_PAGE_SIZE;
```

Render current member rows in a normal `<ul className={styles.staticList}>` below the threshold, and use the existing TanStack virtualizer above it. Reuse one `renderMember` function for both paths.

- [ ] **Step 4: Run typecheck**

Run `npm run typecheck`.

Expected: PASS and no generic mismatch in `sortRoomMembers` or virtual row rendering.

### Task 6: Restore profile length limits end-to-end

**Files:**
- Modify: `src/lib/validation/auth.ts`
- Modify: `src/app/(app)/profile/profile-form.tsx`
- Modify: `src/features/room-profiles/actions.ts`
- Modify: `src/components/rooms/room-profile-form.tsx`
- Test: `src/lib/validation/auth.test.ts`

- [ ] **Step 1: Set the server validation limits**

```ts
displayName: z.string().trim().min(1, "กรุณากรอกชื่อที่แสดง").max(40, "ชื่อที่แสดงต้องไม่เกิน 40 ตัวอักษร")
```

For the room-specific display name, use `.max(40, "ชื่อในห้องต้องไม่เกิน 40 ตัวอักษร")`. Keep the existing username limit of 30.

- [ ] **Step 2: Match browser input limits**

Set `maxLength={40}` on both profile display-name inputs. Do not alter image upload or submit behavior.

- [ ] **Step 3: Run validation tests**

Run:

```powershell
node --test --experimental-strip-types src/lib/validation/auth.test.ts
```

Expected: PASS for length 40 and FAIL for length 41.

### Task 7: Restore board vocabulary and finance formatting without replacing their UI

**Files:**
- Modify: `src/lib/boards/board-copy.ts`
- Modify: `src/lib/boards/board-copy.test.ts`
- Modify: `src/lib/finance/summary.ts`
- Modify: `src/lib/finance/summary.test.ts`

- [ ] **Step 1: Normalize Board item labels**

Use these three labels across friend, couple and family variants:

```ts
const COMMON_ITEM_LABELS = {
  note: "โน้ต",
  poll: "โหวต",
  checklist: "เช็คลิส",
};
```

Update action labels and `itemTypeLabels`, but preserve the current descriptions and modal behavior.

- [ ] **Step 2: Restore Thai baht suffix formatting**

```ts
export function formatBaht(amountCents: number): string {
  return `${new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)} บาท`;
}
```

Do not add FinanceV2 fields, routes or schema.

- [ ] **Step 3: Run Board and Finance tests**

Run:

```powershell
node --test --experimental-strip-types src/lib/boards/board-copy.test.ts src/lib/finance/summary.test.ts
```

Expected: PASS.

### Task 8: Port small behavior improvements into current UI files

**Files:**
- Modify: `src/components/rooms/room-chat-widget.tsx`
- Inspect: `src/components/ui/modal.tsx` (no planned edit)
- Modify: `src/app/(app)/loading.tsx`
- Modify: `src/app/(app)/loading.module.css`

- [ ] **Step 1: Prefix the collapsed chat preview with its sender**

Keep the current Chat component and realtime subscriptions. Replace only the preview text with:

```tsx
<small>
  {latestMessage.userId === currentUserId
    ? "คุณ: "
    : `${latestMessage.senderName}: `}
  {latestMessage.body}
</small>
```

- [ ] **Step 2: Preserve the current Modal implementation**

Compare with `e3961c4` only for accessibility behavior. Keep the current portal, focus handling, Escape key, body scroll lock and backdrop policy. Do not restore old dimensions or CSS wholesale.

- [ ] **Step 3: Align loading skeleton with the current room shell**

Restore the semantic structure `hero -> avatar/heroCopy/stats` and `grid -> cardLarge/card`, but map colors, radii and spacing to current tokens. Do not copy obsolete room-home dimensions.

- [ ] **Step 4: Run lint and typecheck**

Run:

```powershell
npm run lint
npm run typecheck
```

Expected: both commands exit with code 0.

### Task 9: Final regression verification

**Files:**
- No planned source changes unless verification exposes a regression

- [ ] **Step 1: Run all restored targeted tests**

```powershell
node --test --experimental-strip-types src/features/family-tree/validation.test.ts src/lib/rooms/labels.test.ts src/lib/validation/auth.test.ts src/lib/boards/board-copy.test.ts src/lib/finance/summary.test.ts
```

Expected: all tests PASS.

- [ ] **Step 2: Run project checks**

```powershell
npm run lint
npm run typecheck
npm run build
```

Expected: all commands exit with code 0. If build depends on unavailable environment values, record the exact missing variable and keep lint/typecheck results separate.

- [ ] **Step 3: Inspect the final diff**

Run:

```powershell
git status --short
git diff --stat
git diff --check
```

Expected: no conflict markers or whitespace errors; map globe, album toss, current themes and current room shell files remain present.

- [ ] **Step 4: Manual browser smoke check**

Verify:

1. Friend/Couple rooms do not show Family Tree.
2. Family rooms show Family Tree last in the main Sidebar group.
3. Family Tree can add/edit/move/link people.
4. Member ordering is owner, current user, then name.
5. Map globe and album toss still render.
6. Chat preview shows `คุณ:` or the sender name.
7. Board labels and finance amount text match the approved Thai copy.

No commit or push is performed until the user explicitly requests it.
