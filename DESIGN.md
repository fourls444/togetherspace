---
name: TogetherSpace
description: พื้นที่ร่วมส่วนตัวสำหรับเพื่อน แฟน และครอบครัว — Private Atelier
colors:
  background: "#0A0908"
  surface: "#141210"
  muted-surface: "#1C1A17"
  hover: "#25221E"
  sidebar: "#12100E"
  text: "#F6F1E8"
  text-muted: "#A39E94"
  placeholder: "#8A847A"
  border: "#2E2B26"
  border-strong: "#3D3933"
  primary: "#C9B896"
  primary-hover: "#D8CBB0"
  primary-soft: "#2A261F"
  primary-text: "#1A1612"
  focus: "#C9B896"
  error: "#C97B7B"
  error-text: "#F3D4D0"
  error-surface: "#2A1818"
  error-border: "#6A3A3A"
  room-friend: "#C9B896"
  room-couple: "#C9968C"
  room-family: "#A8B08C"
  wave-horizon: "#0A0908"
  wave-mid: "#1A1714"
  wave-crest: "#C9B896"
typography:
  display:
    fontFamily: "Bodoni Moda, Taviraj, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.35rem, 5vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  brand:
    fontFamily: "Bodoni Moda, Taviraj, Georgia, Times New Roman, serif"
    fontSize: "1.35rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Libre Franklin, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Libre Franklin, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-sm:
    fontFamily: "Libre Franklin, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Libre Franklin, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
  caption:
    fontFamily: "Libre Franklin, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mark:
    fontFamily: "Libre Franklin, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.16em"
rounded:
  control: "0.25rem"
  panel: "0.4rem"
  auth-card: "0.5rem"
  room: "0.5rem"
  brand-mark: "0.25rem"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1.25rem"
  xl: "1.5rem"
  2xl: "2rem"
  2-25: "2.25rem"
  form-gap: "1.25rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.15rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-text}"
  button-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.15rem"
    height: "2.5rem"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.15rem"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0.7rem 0.95rem"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  badge:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.control}"
    padding: "0.2rem 0.55rem"
---

# Design System: TogetherSpace

## Overview

**Creative North Star: "Private Atelier"**

TogetherSpace รู้สึกเหมือนห้องส่วนตัวของบ้านแฟชั่นหลังค่ำ: หมึกอุ่น ตัวอักษรงาช้าง และโลหะแชมเปญเส้นบาง ความหรูมาจาก **การตัดออก** ไม่ใช่การเติมแสง — สีน้อยมาก โมชันเกือบไม่ขยับ หัวข้อ Didone ใหญ่เมื่อมีน้ำหนักอารมณ์

Living Room After Dark (น้ำเงิน + โคมอำพัน + clay) เป็น anti-reference แล้ว ไม่ใช้ teal ม่วงนีออน หรือพื้นขาวสว่างทั้งหน้า

**Key Characteristics:**
- พื้นหมึกอุ่นชิ้นเดียว ไม่ใช่การ์ดลอยหนา
- ความลึกมาจากเส้น hairline + เงาผ้าม่าน ไม่ใช่ neumorphism
- Champagne เป็นโลหะหายาก — ปุ่มและการเลือกเท่านั้น
- ข้อความยาวเป็น Ivory บนหมึก — อ่านชัด

## Colors

พาเลตเกือบไม่มีสี: หมึก / งาช้าง / แชมเปญ

### Primary
- **Champagne** (`#C9B896`): ปุ่มหลัก, จุดโฟกัส, crest ของคลื่น auth
- **Champagne Lift** (`#D8CBB0`): hover ปุ่มหลัก
- **Champagne Soft** (`#2A261F`): soft fill

### Neutral
- **Warm Ink** (`#0A0908`): พื้นหลังแอป
- **Atelier Surface** (`#141210`): การ์ด, พาเนล
- **Mute Oak** (`#1C1A17`): พื้นรอง
- **Ivory** (`#F6F1E8`): ข้อความหลัก
- **Dust** (`#A39E94`): คำอธิบายรอง
- **Faded Oak** (`#8A847A`): placeholder เท่านั้น
- **Hairline** (`#2E2B26`): ขอบบาง

### Room Mood
โลหะคนละชนิด — ต้องแยกได้ทันทีจากสี ไม่ใช่แค่อ่านคำ
- **Friend Champagne** (`#C9B896`) ทองแชมเปญ
- **Couple Rose Gold** (`#C9968C`) โรสโกลด์
- **Family Sage Bronze** (`#A8B08C`) ทองมะกอก

### Named Rules
**The Almost No Colour Rule.** สีใช้กับ action และประเภทห้องเท่านั้น ไม่ใช้เป็นย่อหน้ายาว

**The Ivory On Ink Rule.** ข้อความยาวต้องเป็น Ivory บนหมึก

**The Room Mood Rule.** ประเภทห้องใช้โลหะคนละชนิด (แชมเปญ / โรสโกลด์ / ทองมะกอก) ไม่เปลี่ยนสีข้อความหลัก

## Typography

**Display Font:** Bodoni Moda + **Taviraj** (ไทย) · fallback Georgia / Times New Roman  
**Body Font:** Libre Franklin + **Anuphan** (ไทย) · fallback system-ui / -apple-system

**Character:** Didone contrast สูงสำหรับประโยคสั้น — optical size ใหญ่บนหัวข้อ, เล็กบนแบรนด์ ป้าย UI ใช้ small-caps tracking กว้างเมื่อเป็นละติน

### Hierarchy
- **Display** (400, `clamp(2.35rem, 5vw, 3.4rem)`, 1.08, tracking -0.03em)
- **Brand** (400, `1.35rem`, 1)
- **Title** (500, `1.15rem`, 1.35)
- **Body** (400, `1rem`, 1.6)
- **Body SM** (400, `0.95rem`, 1.65)
- **Label** (500, `0.75rem`, tracking 0.12em)
- **Caption** (400, `0.875rem`, 1.5)
- **Mark** (500, `0.7rem`, tracking 0.16em)

### Named Rules
**The Quiet Display Rule.** Bodoni + Taviraj สำรองไว้กับประโยคสั้นที่มีน้ำหนักอารมณ์

**The Matched Pair Rule.** Display = Bodoni Moda/Taviraj · UI = Libre Franklin/Anuphan

**The Small Caps Rule.** ป้ายละตินใช้ tracking กว้าง — ข้อความไทยไม่บังคับ uppercase

## Layout

Auth landing เป็น split ~45/55 ตั้งแต่ `960px`: ซ้ายแบรนด์ + สโลแกน Didone + ฟอร์ม, ขวา vignette เต็มคอลัมน์ จอเล็กซ้อนแนวตั้งและให้ฟอร์มมาก่อน

แอปภายในใช้ topbar + เนื้อหา ความหนาแน่นปานกลาง — หรูด้วยลมหายใจและเส้นบาง

## Elevation & Depth

ผิวแอปเป็นหมึก + hairline ไม่ใช่ clay

### Shadow Vocabulary
- **Veil** (`0 1px 0 rgb(246 241 232 / 0.08), 0 18px 40px rgb(10 9 8 / 0.55)`): พาเนล การ์ด
- **Veil SM** (`0 1px 0 rgb(246 241 232 / 0.06), 0 8px 20px rgb(10 9 8 / 0.4)`): ปุ่มรอง
- **Inset Hairline** (`inset 0 0 0 1px rgb(246 241 232 / 0.08)`): ช่องกรอก พื้นที่กด
- **Metal Veil** (`0 1px 0 rgb(246 241 232 / 0.18), 0 12px 28px rgb(10 9 8 / 0.4)`): ปุ่ม Champagne
- **Panel** (`0 0 0 1px rgb(246 241 232 / 0.08), 0 24px 48px rgb(10 9 8 / 0.45)`): การ์ด auth / ฮีโร่

### Named Rules
**The Hairline Rule.** ขอบ 1px เป็นตัวแบ่งลำดับชั้น ไม่ใช้เงาคู่แบบ clay

## Shapes

มุมเกือบแหลม: control `0.25rem`, panel `0.4rem` — สถาปัตย์บ้าน ไม่ใช่ซอฟท์แวร์เม็ดยา ยกเว้นเมื่อจำเป็นจริง

## Components

บุคลิก: **หรู เงียบ ช้า**

### Buttons
- **Primary:** Champagne พื้น + ตัวอักษรหมึก
- **Default:** พื้นหมึก + ขอบ hairline
- **Danger:** error พื้น + ตัวอักษรหมึก
- **Focus:** outline 1px Champagne + offset `3px`

### Cards / Containers
- พื้น Atelier Surface หรือ Warm Ink
- ขอบ Hairline + Veil
- ไม่ใช้ clay extrude

### Inputs / Fields
- พื้น Warm Ink, ขอบ Hairline, inset บาง
- Focus เป็น Champagne เส้นเดียว

### Navigation
- Topbar เส้นล่าง hairline; รายการที่เลือกเป็นตัว Champagne ไม่ใช่หลุมกด

### Signature: Auth Waves
- horizon Warm Ink, wave mid `#1A1714`, crest Champagne — ผ้าไหมไม่ใช่คลื่นนีออน

## Motion & Play

โมชันเกือบไม่ขยับ:

- **Lightfall** แสงตกเบาๆ หลังล็อกอิน — เฉพาะเครื่องที่ไหว, 24fps, ไม่รันในห้อง
- **Iridescence** ไหมโลหะแชมเปญบนการ์ดหน้าแรกและพื้นหลังในห้อง — เครื่องอ่อนวาดเฟรมเดียว / ปิด WebGL แล้วใช้ไล่สี CSS
- **Lamp cursor** เป็นฝุ่นงาช้างจางมาก (เดสก์ท็อป)
- **Click spark** ประกาย Champagne สั้น
- **Spotlight / BorderGlow** ขอบโลหะตามนิ้ว เข้มน้อย
- **Room tint** เพื่อน=แชมเปญ · คู่รัก=โรสโกลด์ · ครอบครัว=ทองมะกอก
- ปิดเมื่อ `prefers-reduced-motion`

## Do's and Don'ts

### Do:
- **Do** ใช้ Ivory สำหรับข้อความยาวบนหมึก
- **Do** เก็บ Champagne ไว้กับปุ่มและจุดสนใจ
- **Do** ใช้ hairline เป็นโครง
- **Do** รักษา split auth ซ้ายสโลแกน+ฟอร์ม / ขวาพรีวิว

### Don't:
- **Don't** กลับไปน้ำเงินโคม clay หรือ teal / ม่วงนีออน
- **Don't** ใช้ Champagne เป็นย่อหน้ายาว
- **Don't** ทำพื้นขาวสว่างทั้งหน้า auth
- **Don't** ใส่การ์ดสถิติรกฝั่งซ้ายของ login
- **Don't** ใช้ glow สว่างหรือ bounce
