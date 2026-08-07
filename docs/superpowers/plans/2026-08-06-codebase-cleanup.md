# TogetherSpace Codebase Cleanup Plan

## เป้าหมาย

จัดโครงสร้างโค้ดและ CSS ให้ค้นหาได้ง่าย ลดความซ้ำซ้อน และเตรียม repository ให้เพื่อน clone แล้วเริ่มทำงานต่อได้โดยไม่เปลี่ยนพฤติกรรมของระบบ

## หลักการ

- Component ที่ใช้หลายหน้าอยู่ใน `components/` และมี CSS Module ของตัวเอง
- CSS ที่ใช้เฉพาะหน้าอยู่ข้าง route นั้น
- `styles/` เก็บเฉพาะ design tokens และค่าพื้นฐานร่วมกัน
- ฟังก์ชันสำคัญมี JSDoc ภาษาไทยที่อธิบายหน้าที่หรือเหตุผล
- ไม่เพิ่ม abstraction หากทำให้โค้ดอ่านยากกว่าเดิม
- ไม่เพิ่ม dependency หรือระบบทดสอบอัตโนมัติในรอบนี้

## งานที่รวมไว้

### 1. Shared Components และ CSS

- [x] แยก `PageShell`, `Panel`, `Button`, `Badge`, `FieldErrors` และ `ErrorState`
- [x] แยก `RoomCard` และ `MemberList` สำหรับข้อมูลห้อง
- [x] รวมโครงหน้า Login/Signup ที่ซ้ำกันเป็น `AuthShell`
- [x] เก็บ form-specific CSS ไว้กับ route และเก็บ shared CSS ไว้กับ component
- [x] จำกัด global CSS ให้เหลือ tokens, reset และ element defaults

### 2. Repository Cleanup

- [x] ลบ starter assets, PostCSS/Tailwind config และ Supabase browser client ที่ไม่ใช้
- [x] ถอด dependency ที่ยังไม่จำเป็นและปรับ lockfile ให้ตรงกัน
- [x] ลบไฟล์ทดสอบและ Vitest ตามขอบเขตที่ผู้ใช้กำหนด
- [x] ปรับ `.gitignore`, `.env.example` และ README สำหรับการ clone
- [x] เก็บ `docs/superpowers` ไว้ใน Git

### 3. ความอ่านง่ายของโค้ด

- [x] ลด markup และ layout ที่ซ้ำกันใน Auth pages
- [x] เพิ่ม JSDoc ภาษาไทยให้ named/exported functions, React components, Server Actions และ proxy
- [x] อธิบาย callback สำคัญที่เกี่ยวข้องกับ session, cookies, validation, permission และ schema
- [x] ไม่ใส่คอมเมนต์ซ้ำ syntax หรือ callback สั้นที่เข้าใจได้จากโค้ด
- [x] รักษาพฤติกรรม Auth, Dashboard และ Create Room เดิม

### 4. การตรวจรอบสุดท้าย

- [x] ตรวจไฟล์หรือ import ที่หลงเหลือจากโครงสร้างเดิม
- [x] ตรวจ `npm run lint`
- [x] ตรวจ `npm run typecheck`
- [x] ตรวจ `npm run build`
- [x] ตรวจ Signup, Login และ protected routes แบบ HTTP smoke test
- [x] ตรวจ whitespace, secret และ dependency vulnerabilities แบบคร่าว ๆ

