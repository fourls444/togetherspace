# TogetherSpace Signup and Test Cleanup Design

## เป้าหมาย

เพิ่มหน้า Signup เพื่อให้ผู้ใช้สร้างบัญชีเองได้โดยไม่ต้องเข้า Supabase Dashboard และลดไฟล์สำหรับการทดสอบอัตโนมัติตามขอบเขตที่ผู้ใช้ต้องการ

ขอบเขตความสมบูรณ์ของรอบนี้สิ้นสุดก่อนการพัฒนา Create Room เพิ่มเติม โดยต้องทำให้ Signup, Login, Logout, Profile อัตโนมัติ, route protection และ Dashboard ทำงานต่อเนื่องกันได้

## Signup flow

- เพิ่ม route `/signup`
- ฟอร์มประกอบด้วย `display_name`, `email`, `password` และ `confirm_password`
- ยังไม่มีช่อง `username` และไม่มีการตรวจ username ซ้ำ
- Supabase Auth รับ `display_name` ผ่าน user metadata
- database trigger เดิมสร้าง Profile และ username ที่ไม่ซ้ำจากอีเมลกับ UUID อัตโนมัติ
- ต้องปิด Confirm Email ใน Supabase เพื่อให้ Supabase สร้าง session และ redirect ไป `/dashboard` ทันที
- หาก Supabase ไม่คืน session ให้แสดงข้อความตั้งค่าระบบว่ายังเปิดการยืนยันอีเมลอยู่ ไม่แสดงว่าสมัครสำเร็จ
- อีเมลยังตรวจรูปแบบพื้นฐาน เนื่องจาก Supabase ต้องใช้อีเมลที่ถูกต้อง แต่ไม่ต้องกดยืนยันอีเมล
- แสดง validation ใต้ช่องที่มีปัญหา ได้แก่ ชื่อที่แสดง, อีเมล, รหัสผ่าน และยืนยันรหัสผ่าน
- แปลง Supabase Auth errors ที่ระบุสาเหตุได้ เช่น อีเมลถูกใช้แล้ว, อีเมลผิดรูปแบบ และรหัสผ่านไม่ผ่านเงื่อนไข ไปยังช่องที่เกี่ยวข้อง
- error ที่ไม่เกี่ยวกับช่องใดช่องหนึ่งให้แสดงเป็น service error โดยไม่เปิดเผยรายละเอียดภายในระบบ
- หน้า Login และ Signup มีลิงก์สลับหากัน

## โครงสร้าง UI

- ใช้ shared `PageShell`, `Panel`, `Button`, `FieldErrors` และ form styles ที่มีอยู่
- CSS ที่ใช้เฉพาะ Signup อยู่ใน `app/signup/signup.module.css`
- รูปแบบเรียบง่ายและสอดคล้องกับหน้า Login ปัจจุบัน

## Auth และ Dashboard

- Login แสดงปัญหาของอีเมลหรือรหัสผ่านอย่างชัดเจนโดยไม่เปิดเผยข้อมูลบัญชีเกินจำเป็น
- Logout ต้องแจ้งข้อผิดพลาดและลองใหม่ได้หาก Supabase ล้มเหลว
- เมื่อ Auth user ถูกสร้าง database trigger ต้องสร้าง Profile ที่มี `username` และ `display_name` อัตโนมัติ
- ผู้ใช้ที่ยังไม่ Login ต้องเข้า Dashboard และ routes ภายใต้ `/rooms` ไม่ได้
- ผู้ใช้ที่ Login แล้วไม่ควรกลับไปหน้า Login หรือ Signup
- Dashboard ต้องแสดง Profile และสถานะโหลดข้อมูลผิดพลาดได้
- เก็บหน้าและ action ของ Create Room เดิมไว้โดยไม่เปลี่ยนพฤติกรรมในรอบนี้

## การลบระบบทดสอบ

- ลบไฟล์ `*.test.ts`, `*.test.tsx`, โฟลเดอร์ `tests/` และ `vitest.config.mts`
- ถอน `vitest` ออกจาก devDependencies และลบ `test` script
- ไม่ลบ lint, TypeScript หรือ production build tooling
- ตรวจระบบแบบคร่าว ๆ ด้วย `npm run lint`, `npm run typecheck`, `npm run build` และ HTTP smoke test หน้า `/signup`

## ไม่รวมในรอบนี้

- Username ที่ผู้ใช้กำหนดเอง
- การตรวจ username ซ้ำ
- OAuth/social login
- Forgot/reset password
- CAPTCHA และ rate limiting เพิ่มเติมนอกเหนือจาก Supabase
- Email confirmation flow
- การแก้หรือเพิ่มความสามารถ Create Room
- การเพิ่ม dependency ใหม่
