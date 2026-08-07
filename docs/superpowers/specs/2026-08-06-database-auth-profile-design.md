# Database, Auth, and Automatic Profile Design

## Scope

สร้างฐานข้อมูล Phase 1 จากแบบที่ผู้ใช้ให้ พร้อมการเชื่อม Supabase Auth สร้าง profile อัตโนมัติ และหน้าจอพื้นฐานที่ใช้ทดสอบเส้นทางหลักได้ โดยยังไม่มีหน้า Signup และยังไม่เน้นงานตกแต่ง

## Data model

- `profiles`: ผูก `id` แบบ one-to-one กับ `auth.users.id`; มี `username`, `display_name`, `avatar_url`, `created_at`, `updated_at`
- `rooms`: เก็บชื่อ ประเภท (`friend`, `couple`, `family`) รูป และผู้สร้าง
- `room_members`: ตารางเชื่อมผู้ใช้กับห้อง ใช้คีย์รวม `(room_id, user_id)` และ role (`owner`, `member`)
- `room_invites`: เก็บรหัสเชิญและ token แบบไม่ซ้ำ พร้อมวันหมดอายุ จำนวนครั้งที่ใช้ และเวลายกเลิก

Foreign keys ที่อ้างข้อมูลแอปใช้ `profiles.id`; ข้อมูลลูกของห้องลบตามห้องด้วย cascade ส่วนผู้สร้างห้องและผู้สร้างคำเชิญไม่ถูกลบอัตโนมัติ

## Automatic profile creation

PostgreSQL trigger บน `auth.users` จะสร้าง `profiles` หลังมีผู้ใช้ใหม่:

- `id` ใช้ UUID เดียวกับผู้ใช้ใน Auth
- `display_name` ใช้ส่วนหน้า `@` ของอีเมลเป็นค่าเริ่มต้น
- `username` ใช้ชื่อจากอีเมลที่ปรับเป็นตัวพิมพ์เล็กและอักขระปลอดภัย ต่อท้ายรหัสสั้นเพื่อป้องกันชื่อซ้ำ
- `avatar_url` เริ่มเป็น `NULL`

Trigger ต้องรองรับอีเมลว่างหรือชื่อที่ไม่ผ่านรูปแบบด้วยค่า fallback ที่สร้างจาก user id

## Application integration

เพิ่ม Supabase client สำหรับ browser และ server ตามรูปแบบของ Next.js 16.3.0 และ `@supabase/ssr` ที่ติดตั้งอยู่ ใช้ Server Actions สำหรับ Login, Logout และคำสั่งที่เปลี่ยนข้อมูล ผู้ใช้สร้างบัญชีทดสอบจาก Supabase Dashboard แล้วเข้าสู่ระบบในแอปได้

## Basic application flow

- `/login`: ฟอร์มอีเมลและรหัสผ่าน พร้อมข้อความผิดพลาด
- `/dashboard`: แสดง profile และห้องที่ผู้ใช้เป็นสมาชิก พร้อมปุ่มสร้างห้องและ Logout
- `/rooms/new`: ฟอร์มชื่อ ประเภท และ URL รูปของห้อง เมื่อสำเร็จสร้างห้องและเพิ่มผู้สร้างเป็น owner ใน transaction เดียว
- `/rooms/[roomId]`: แสดงข้อมูลห้องและรายชื่อสมาชิก; ผู้ที่ไม่ใช่สมาชิกเข้าไม่ได้

Middleware จะ refresh session และป้องกันหน้าภายใน ส่วน Server Actions จะตรวจผู้ใช้ซ้ำก่อนอ่านหรือแก้ข้อมูล ไม่พึ่ง middleware เพียงอย่างเดียว

UI ใช้ semantic HTML และ CSS พื้นฐานสำหรับโครงหน้า ระยะห่าง ฟอร์ม ปุ่ม และข้อความสถานะ โดยไม่มี design system, component library หรือรายละเอียดจาก Figma ในรอบนี้

## Security

เปิด Row Level Security ทุกตาราง โดยใช้หลักการขั้นต่ำ:

- ผู้ใช้ดูและแก้ไข profile ของตนเองได้
- สมาชิกดูห้องและสมาชิกร่วมของห้องที่ตนอยู่ได้
- owner จัดการห้อง สมาชิก และคำเชิญของห้องได้
- ผู้ใช้ที่ผ่านการยืนยันตัวตนอ่านคำเชิญที่ยังใช้ได้เพื่อรองรับ Join Room ในขั้นถัดไป

ฟังก์ชันช่วยตรวจสมาชิกใช้ `security definer` พร้อมกำหนด `search_path` อย่างชัดเจน เพื่อหลีกเลี่ยง RLS recursion และลดความเสี่ยงจากการค้นหา object ผิด schema

## Validation and verification

- ตรวจโครงสร้าง Drizzle ด้วย type checking และ schema-level tests
- สร้าง migration จาก Drizzle และตรวจ SQL ที่ได้
- ตรวจ lint และ production build
- ทดสอบ validation และ Server Actions ที่แยก logic ออกมาได้
- การทดสอบจริงใน Supabase: สร้างผู้ใช้หนึ่งราย แล้วตรวจว่ามี `profiles` ที่ id ตรงกันและค่าเริ่มต้นครบ

## Out of scope

- หน้า Signup
- Join Room และการจัดการสมาชิก
- การอัปโหลด avatar
- การส่งอีเมลเชิญและ realtime
- role `admin` ซึ่งไม่มีในแบบตารางล่าสุด
