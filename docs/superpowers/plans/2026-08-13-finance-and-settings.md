# แผนพัฒนา Finance และปรับ Settings

1. ปรับโครงหน้า Settings และ CSS ของฟอร์มเดิมให้เป็นสองคอลัมน์บนเดสก์ท็อป คอลัมน์เดียวบนมือถือ จำกัดความกว้าง input และจัดลำดับ action ใหม่
2. เขียน unit test สำหรับ validation เงิน การแบ่งยอด และการคำนวณหนี้ จากนั้นเพิ่ม helper ให้ test ผ่าน
3. เพิ่ม schema, migration และ RLS สำหรับ `finance_expenses` กับ `finance_expense_splits` พร้อมอัปเดตชนิดข้อมูลในแอป
4. เพิ่ม Server Actions สำหรับสร้าง แก้ไข และลบค่าใช้จ่าย โดยตรวจสมาชิก สิทธิ์ และยอดแบ่งทุกครั้ง
5. สร้างหน้า Finance, modal ฟอร์ม, สรุปยอด, รายการค่าใช้จ่าย, ตัวกรองเดือน/ค้นหา และสถานะว่าง โดยใช้ CSS Modules และ component เดิม
6. เพิ่ม Finance เข้า navigation, หน้าหลักห้อง และข้อความตามประเภทห้อง
7. อัปเดต README และแผน module ถัดไป: Family tree กับ Friend detailed profile
8. ตรวจ unit tests, typecheck, lint และ build; แก้เฉพาะปัญหาที่เกี่ยวกับงานรอบนี้
