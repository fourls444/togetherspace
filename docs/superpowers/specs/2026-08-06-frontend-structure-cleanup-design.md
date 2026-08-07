# Frontend Structure and Clone Cleanup Design

## Goal

ปรับโครงสร้าง TogetherSpace ให้เพื่อน clone แล้วเข้าใจตำแหน่งไฟล์ได้ง่าย แยกส่วนที่ใช้ซ้ำออกเป็น components วาง CSS เฉพาะหน้าไว้ใกล้ route และลบ starter files หรือ dependencies ที่ยังไม่ใช้ โดยไม่เปลี่ยนพฤติกรรมของระบบที่ทำงานอยู่

## Structure

- `app/` เก็บ routes, route-specific actions, forms และ CSS Modules ที่ใช้เฉพาะหน้านั้น
- `components/layout/` เก็บโครงหน้าที่ใช้ซ้ำ เช่น page shell
- `components/ui/` เก็บส่วนประกอบพื้นฐาน เช่น panel, badge, button link และ field errors โดย CSS Module อยู่ข้าง component
- `components/rooms/` เก็บ room card และ member list ที่ใช้แสดงข้อมูลห้อง
- `styles/tokens.css` เก็บค่ากลาง เช่น สี ระยะ ขนาดมุม และเงา
- `styles/base.css` เก็บ element defaults และ body styles
- `app/globals.css` import CSS กลางเท่านั้น
- `lib/`, `db/`, `drizzle/` คงหน้าที่เดิม
- `docs/superpowers/` เก็บแบบและแผนใน Git

## Styling

ถอด Tailwind และ PostCSS plugin ออกจากโปรเจกต์ ใช้ CSS Modules ที่ Next.js รองรับโดยตรงแทน:

- style ที่ใช้เฉพาะหน้าอยู่ใน `*.module.css` ของ route
- style ที่ใช้เฉพาะ shared component อยู่ใน `*.module.css` ข้าง component
- ไม่มี global class สำหรับ button, panel, badge, input หรือ page shell
- global CSS มีเฉพาะ tokens, base styles และ font inheritance
- UI ยังคงเรียบง่าย responsive และรองรับ focus/disabled/error states

## Reusable components

- `PageShell`: กำหนดความกว้างและระยะขอบหน้าหลัก
- `Panel`: พื้นผิวเนื้อหาที่มี border และ padding
- `Badge`: แสดง role, room type หรือจำนวนสมาชิก
- `ButtonLink`: link ที่มีลักษณะเหมือน button พร้อม primary/default variants
- `FieldErrors`: แสดง validation messages ที่เข้าถึงได้
- `RoomCard`: แสดงชื่อ ประเภท และ role ของห้อง
- `MemberList`: แสดง profile และ role ของสมาชิก

Forms และ Server Actions ยังคง colocate กับ route เพราะยังไม่ได้ใช้ข้าม feature

## Clone readiness

- แก้ `.gitignore` ให้ ignore `.env.local` และ env จริง แต่อนุญาต `.env.example`
- `.env.example` มีตัวแปรทั้งสี่พร้อมค่าว่างหรือ localhost และไม่มี secret
- เขียน README สำหรับ install, env setup, migration, dev, test และ build
- ลบ SVG เริ่มต้นของ Next.js ที่ไม่มีการอ้างอิง
- ลบ `nanoid`, Tailwind, Tailwind PostCSS plugin และไฟล์ `postcss.config.mjs`
- ลบ browser Supabase client เพราะยังไม่มี Client Component ใดเรียก Supabase โดยตรง
- ลบ Geist Mono เพราะยังไม่มีจุดใช้งาน
- คง Drizzle migrations, metadata, tests, favicon, AGENTS.md และ config ที่จำเป็น

## Error handling

- Dashboard แสดงสถานะที่เข้าใจได้เมื่อโหลด profile, memberships หรือ rooms ไม่สำเร็จ
- Room detail แยกกรณีไม่มีสิทธิ์/ไม่พบห้องออกจาก database failure
- เพิ่ม `app/not-found.tsx` สำหรับ URL ห้องที่ไม่ถูกต้องหรือเข้าถึงไม่ได้
- Login และ Create Room ยังคงแสดง validation และ service errors ในฟอร์ม

## Verification

- tests เดิมต้องผ่านโดยไม่มี behavior regression
- lint, typecheck และ production build ต้องผ่านโดยไม่มี warning
- smoke test หน้า Login ต้องตอบกลับสำเร็จ
- ตรวจว่า `.env.example` ไม่ถูก ignore และ `.env.local` ยังถูก ignore
- ตรวจ repository ไม่มี starter asset, unused dependency หรือ embedded credential

## Out of scope

- เปลี่ยน visual design ให้ตรง Figma
- เพิ่ม Signup, Join Room หรือ member management
- เพิ่ม component library หรือ dependency ใหม่
- สร้าง Supabase types อัตโนมัติ
- commit หรือ push
