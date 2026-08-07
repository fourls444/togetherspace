# Simple Code and Thai Comments Design

## เป้าหมาย

ทำให้ source code ปัจจุบันของ TogetherSpace อ่านและดูแลรักษาง่ายขึ้น ลดความซ้ำซ้อนที่มีประโยชน์ต่อการอ่าน และเพิ่มคำอธิบายภาษาไทยโดยไม่ทำให้ไฟล์เต็มไปด้วยคอมเมนต์ที่ทวนสิ่งซึ่งโค้ดบอกอยู่แล้ว

## ขอบเขต

- ครอบคลุม `app/`, `components/`, `lib/`, `db/`, `proxy.ts`, `drizzle.config.ts` และ `next.config.ts`
- ไม่เปลี่ยน database schema, Auth behavior, Dashboard behavior หรือ Create Room behavior
- ไม่เพิ่ม dependency และไม่เพิ่มระบบ automated tests กลับมา

## หลักการคอมเมนต์

- ทุก named function, exported function, React component, Server Action, page component และ route/proxy function ต้องมี JSDoc ภาษาไทยอยู่เหนือ declaration
- คอมเมนต์ต้องอธิบายหน้าที่ เหตุผล หรือผลลัพธ์ของฟังก์ชัน ไม่แปลชื่อฟังก์ชันซ้ำเฉย ๆ
- callback ที่มีผลต่อ session, cookies, validation, permission หรือการแปลงข้อมูลสำคัญต้องมีคอมเมนต์ภาษาไทย
- callback สั้นที่ความหมายชัด เช่น `map`, `filter`, `forEach` สำหรับจัดรูปแบบข้อมูลธรรมดา ไม่ต้องมีคอมเมนต์ทุกตัว
- ไม่ใส่คอมเมนต์ท้ายบรรทัดจำนวนมาก และไม่อธิบาย syntax ของ TypeScript/React

## การลดความซ้ำซ้อน

- รวมโครงหน้า Auth ที่ Login และ Signup ใช้เหมือนกันเป็น shared component พร้อม CSS Module ของ component
- เก็บ CSS เฉพาะฟอร์มหรือข้อความของแต่ละ route ไว้กับ route เดิม
- ใช้ helper ที่มีอยู่ เช่น Auth error mapper, shared button, field errors และ panel ต่อไป
- ไม่สร้าง generic form abstraction สำหรับ input ทุกชนิด เพราะจะเพิ่มความซับซ้อนมากกว่าประโยชน์ในขนาดโปรเจกต์ปัจจุบัน
- แยก helper ใหม่เฉพาะเมื่อทำให้ call site สั้นลงและชื่อ helper อธิบาย intent ได้ชัดเจน

## การตรวจสอบ

- ตรวจว่า source functions ในขอบเขตมี JSDoc ภาษาไทยครบด้วยการค้นหาและ code review
- รัน `npm run lint`, `npm run typecheck` และ `npm run build`
- HTTP smoke test หน้า Signup, Login และ protected routes
- ยืนยันว่าไม่มีการเปลี่ยน behavior ของ Create Room
- ไม่ commit และไม่ push
