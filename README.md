# TogetherSpace

เว็บสำหรับสร้างพื้นที่ร่วมกันและจัดการสมาชิกในห้อง ปัจจุบันรองรับ Supabase Signup/Login, Dashboard, การสร้างห้อง, การเข้าร่วมห้อง, คำเชิญ, การจัดการสมาชิกขั้นพื้นฐาน และ Board MVP

## Requirements

- Node.js 20.9 หรือใหม่กว่า
- npm
- Supabase project

## เริ่มต้นใช้งาน

ติดตั้ง dependencies:

```bash
npm install
```

สร้างไฟล์ environment จากตัวอย่าง:

```bash
cp .env.example .env.local
```

สำหรับ PowerShell:

```powershell
Copy-Item .env.example .env.local
```

กรอกค่าต่อไปนี้ใน `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
DATABASE_URL=
```

- Project URL และ Publishable key อยู่ใน Supabase Dashboard → Settings → API Keys
- Database URL อยู่ในปุ่ม Connect ของ Supabase Dashboard
- ห้าม commit `.env.local`

นำ database migrations ไปใช้:

```bash
npm run db:migrate
```

เริ่ม development server:

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

สมัครสมาชิกได้ที่ [http://localhost:3000/register](http://localhost:3000/register) หน้าเว็บจะแสดงคำว่า Signup/สมัครสมาชิก โดยกรอก username, email และ password ก่อน ส่วน display name แก้ไขได้ที่หน้า Profile

### ตรวจการยืนยันอีเมลใน Supabase

ถ้าต้องการให้สมัครแล้วเข้า Dashboard ได้ทันที ให้ตรวจว่า Confirm Email ปิดอยู่:

1. เปิด Supabase Dashboard → Authentication → Providers
2. เปิด Email provider
3. ปิด Confirm Email แล้วบันทึก

หากเคยลองสมัครตอน Confirm Email ยังเปิดอยู่ บัญชีนั้นจะยังเป็นบัญชีที่รอยืนยัน ให้ไปที่ Authentication → Users แล้วลบบัญชีทดสอบเดิมก่อนสมัครใหม่ หรือยืนยันบัญชีเดิมด้วยตนเองหนึ่งครั้ง

> แอปไม่สามารถปิด Confirm Email ด้วย Publishable Key ได้ ต้องตั้งค่านี้ใน Supabase Dashboard

## คำสั่งสำคัญ

```bash
npm run lint         # ตรวจ ESLint
npm run typecheck    # ตรวจ TypeScript
npm run build        # สร้าง production build
npm run db:generate  # สร้าง Drizzle migration จาก schema
npm run db:migrate   # นำ migrations ไปใช้
npm run db:studio    # เปิด Drizzle Studio
```

## โครงสร้างหลัก

```text
app/          routes, route actions และ CSS เฉพาะหน้า
components/   components ที่ใช้ซ้ำ พร้อม CSS Modules
styles/       design tokens และ base styles
lib/          Supabase, types และ validation
db/           Drizzle schema
drizzle/      SQL migrations และ metadata
docs/         design specs และ implementation plans
```

## Phase ปัจจุบัน

ทำแล้ว:

- Supabase password Login/Logout
- สมัครสมาชิกโดยไม่ต้องยืนยันอีเมล
- สร้าง Profile อัตโนมัติจาก Auth user
- Dashboard และรายการห้อง
- สร้างห้องพร้อมเพิ่มผู้สร้างเป็น Owner
- Room Detail และรายชื่อสมาชิก
- เข้าร่วมห้องด้วย Room Code หรือ Invite Code
- สร้าง/ยกเลิกคำเชิญ และเปิดลิงก์คำเชิญพร้อมหน้า Preview ก่อนเข้าร่วม
- จัดการสมาชิกขั้นพื้นฐาน เช่น เปลี่ยน role, ลบสมาชิก และออกจากห้อง
- Board MVP สำหรับ note, checklist และ poll
- Row Level Security

ยังไม่รวม Upload, Realtime, Notification, Calendar, Album, Map, Finance, Chat, drag-and-drop board และ UI ตาม Figma ฉบับสมบูรณ์
