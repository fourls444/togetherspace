# TogetherSpace Agent Guide

อ่านไฟล์นี้และ `.cursor/rules/` ก่อนลงมือแก้โค้ด

## โปรเจคนี้คืออะไร
TogetherSpace = เว็บพื้นที่ร่วมสำหรับกลุ่มเพื่อน / แฟน / ครอบครัว  
มีห้อง, สมาชิก, คำเชิญ และจะมีโมดูลกิจกรรม (อัลบั้ม ปฏิทิน ฯลฯ) ทีหลัง

## ใครทำอะไร
| ฝั่ง | รับผิดชอบ |
|------|-----------|
| เพื่อน | Backend, Supabase, DB, Auth logic, RLS |
| ในแชทนี้ | Frontend ให้ดูดี ใช้ง่าย ตามธีมที่ล็อก |

อย่าเปลี่ยน schema / migration / RPC / นโยบายสิทธิ์ ถ้าผู้ใช้ไม่ได้ขอ

## ธีมสี (ล็อก)
ดูตารางใน `.cursor/rules/togetherspace-product.mdc`  
อัปเดตค่าจริงใน `src/styles/tokens.css`

หลักสั้นๆ: พื้นหมึก `#0A0908` · การ์ด `#141210` · ข้อความงาช้าง `#F6F1E8` · ปุ่มแชมเปญ `#C9B896`

## Typography (ล็อก)
- Display: **Bodoni Moda** + **Taviraj** (ไทย)
- UI/Body: **Libre Franklin** + **Anuphan** (ไทย)
- รายละเอียด: `docs/TYPOGRAPHY.md`

## หน้า Login / Register (สำคัญ)
เลย์เอาต์แบบ split:
- **ซ้าย** สโลแกน + ช่องทาง login
- **ขวา** พรีวิววิดีโอโปรโมตภาพรวมเว็บ

รายละเอียดบังคับอยู่ใน `.cursor/rules/auth-landing-layout.mdc`

## Stack ที่ใช้อยู่
- Next.js App Router ใต้ `src/app/`
- CSS Modules + tokens ใน `src/styles/`
- Supabase Auth (อย่าพัง flow เดิมตอนจัด UI)

## ก่อน commit / push
ทำเมื่อผู้ใช้ขอเท่านั้น

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
