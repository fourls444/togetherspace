# Typography — TogetherSpace

ระบบตัวอักษรแบบสองภาษา (ไทย + อังกฤษ) สำหรับทั้งโปรเจค  
ธีมภาพ: **Living Room After Dark**

## คู่ฟอนต์ที่ล็อก

| บทบาท | อังกฤษ (Latin) | ไทย (Thai) | เหตุผลคู่กัน |
|--------|----------------|------------|-------------|
| **Display** | Instrument Serif | Taviraj | เซริฟอบอุ่น มี contrast หนา–บาง ใช้กับสโลแกน/ชื่อแบรนด์/หัวข้อบรรยากาศ |
| **UI / Body** | DM Sans | Anuphan | ซานส์ทันสมัย อ่านง่าย เหมาะฟอร์ม ปุ่ม ข้อความทั่วไป |

อย่าสลับบทบาท: อย่าใช้ Taviraj/Instrument กับตารางหรือป้ายฟอร์ม และอย่าใช้ Anuphan/DM Sans เป็นหัวข้อฮีโร่บนหน้า auth

## CSS stacks (ใช้ทั่วทั้งแอป)

```css
/* ข้อความทั่วไป / UI */
font-family: var(--font-sans), var(--font-sans-thai), system-ui, -apple-system, sans-serif;

/* สโลแกน / แบรนด์ / หัวข้ออารมณ์ */
font-family: var(--font-display), var(--font-display-thai), Georgia, "Times New Roman", serif;
```

เบราว์เซอร์จะดึงไกลฟ์ภาษาอังกฤษจากฟอนต์ Latin และไกลฟ์ไทยจากฟอนต์ Thai อัตโนมัติ

## ตัวแปรในโค้ด

| CSS variable | ฟอนต์ |
|--------------|--------|
| `--font-sans` | DM Sans |
| `--font-sans-thai` | Anuphan |
| `--font-display` | Instrument Serif |
| `--font-display-thai` | Taviraj |

โหลดที่ `src/app/layout.tsx` ผ่าน `next/font/google`

## ขนาด (สอดคล้อง DESIGN.md)

| บทบาท | ขนาด | ใช้กับ |
|--------|------|--------|
| Display | `clamp(2rem, 4.2vw, 2.75rem)` | สโลแกน, หัว vignette |
| Brand | `1.35rem` | ชื่อ TogetherSpace |
| Title | `1.2rem` | หัวการ์ดฟอร์ม |
| Body | `1rem` | เนื้อหาทั่วไป |
| Body SM | `0.95rem` | คำอธิบายรอง |
| Label | `0.875rem` | ป้ายฟอร์ม |
| Mark | `0.75rem` | ตัวอักษรใน brand mark |

## กฎสั้นๆ

1. **ภาษาไทยเป็นหลัก** — ทดสอบสโลแกนและฟอร์มด้วยข้อความไทยจริงเสมอ
2. **Quiet Display** — Instrument Serif + Taviraj เฉพาะประโยคสั้นที่มีน้ำหนักอารมณ์
3. **ความสูงบรรทัดไทย** — body/support ใช้ line-height ≥ 1.55 เพราะสระและวรรณยุกต์ซ้อนชั้น
4. **อย่าใส่ฟอนต์อื่น** โดยไม่ผ่านไฟล์นี้และ `DESIGN.md`

## ไฟล์ที่เกี่ยวข้อง

- `DESIGN.md` — ระบบดีไซน์เต็ม (รวม typography)
- `docs/DESIGN_BRIEF.md` — สรุปสั้นสำหรับเอเจนต์
- `src/app/layout.tsx` — โหลดฟอนต์
- `src/styles/base.css` — stack เริ่มต้นของ body
