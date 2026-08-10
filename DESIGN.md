---
name: TogetherSpace
description: พื้นที่ร่วมอบอุ่นสำหรับเพื่อน แฟน และครอบครัว — Living Room After Dark
colors:
  background: "#0D1424"
  surface: "#151D31"
  muted-surface: "#1C2540"
  hover: "#243050"
  sidebar: "#0F1628"
  text: "#F3EDE3"
  text-muted: "#A8B0C2"
  placeholder: "#6F788F"
  border: "#2A334A"
  border-strong: "#3D4A66"
  primary: "#E8A055"
  primary-hover: "#F0B56E"
  primary-soft: "#3A2A18"
  primary-text: "#1A1208"
  focus: "#F0B56E"
  error: "#F08080"
  error-text: "#FFD4D4"
  error-surface: "#3A1C22"
  error-border: "#7A3038"
  wave-horizon: "#0D1424"
  wave-mid: "#1A2744"
  wave-crest: "#E8A055"
typography:
  display:
    fontFamily: "Instrument Serif, Taviraj, Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 4.2vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  brand:
    fontFamily: "Instrument Serif, Taviraj, Georgia, Times New Roman, serif"
    fontSize: "1.35rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "DM Sans, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  body-sm:
    fontFamily: "DM Sans, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  mark:
    fontFamily: "DM Sans, Anuphan, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.03em"
rounded:
  control: "0.75rem"
  panel: "1rem"
  auth-card: "1.15rem"
  room: "1.5rem"
  brand-mark: "0.75rem"
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
    padding: "0.375rem 0.875rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-text}"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0.375rem 0.875rem"
    height: "2.25rem"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.control}"
    padding: "0.375rem 0.875rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0.625rem 0.875rem"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  badge:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.625rem"
---

# Design System: TogetherSpace

## Overview

**Creative North Star: "The Living Room After Dark"**

TogetherSpace รู้สึกเหมือนห้องนั่งเล่นตอนค่ำ: ผนังน้ำเงินมืด โซฟาครีม และแสงโคมเหลืองส้มอ่อนที่ให้ความอบอุ่นโดยไม่ฉูดฉาด ระบบภาพนี้หรูและเงียบสงบ — ใช้พื้นที่ว่างและแสงน้อยจุดแทนการตกแต่งหนาแน่น ความหนาแน่นปานกลาง อ่านง่ายบนทุกอุปกรณ์ที่รองรับ

โทนสี teal เดิมถูกทิ้งเป็น anti-reference แล้ว ไม่ใช้ม่วงนีออน พื้นขาวสว่างทั้งหน้า หรือ amber เป็นสีย่อหน้ายาว

**Key Characteristics:**
- ห้องน้ำเงินมืดเป็นพื้นหลัก
- แสงโคม amber เป็น accent หายากและจงใจ
- ข้อความครีมอุ่น อ่านชัดบนพื้นมืด
- เงาโคมนุ่มๆ และบรรยากาศเงียบสงบ

## Colors

พาเลตหนึ่งโทนแสง: น้ำเงินมืดเป็นห้อง, amber เป็นโคม, ครีมเป็นเนื้อผ้าที่อ่านได้

### Primary
- **Lamp Amber** (`#E8A055`): ปุ่มหลัก, จุดโฟกัส, crest ของคลื่น auth — แสงโคมที่ไม่ควรครองทั้งจอ
- **Lamp Amber Hover** (`#F0B56E`): สถานะ hover ของปุ่มหลัก
- **Lamp Soft** (`#3A2A18`): soft fill / chip ที่เกี่ยวกับ accent

### Neutral
- **Night Wall** (`#0D1424`): พื้นหลังแอป
- **Cabinet Surface** (`#151D31`): การ์ด, พาเนล, ช่องกรอก
- **Shelf Mute** (`#1C2540`): พื้นรอง, badge
- **Sofa Cream** (`#F3EDE3`): ข้อความหลัก
- **Quiet Mist** (`#A8B0C2`): คำอธิบายรอง
- **Faded Linen** (`#6F788F`): placeholder เท่านั้น
- **Door Line** (`#2A334A`): ขอบมาตรฐาน

### Named Rules
**The Lamp Light Rule.** Amber ใช้กับ action และจุดสนใจเท่านั้น ไม่ใช้เป็นย่อหน้ายาว

**The Cream On Night Rule.** ข้อความยาวต้องเป็น Sofa Cream บนพื้นมืด — ห้ามลดคอนทราสต์ด้วยสี accent

## Typography

**Display Font:** Instrument Serif + **Taviraj** (ไทย) · fallback Georgia / Times New Roman  
**Body Font:** DM Sans + **Anuphan** (ไทย) · fallback system-ui / -apple-system

**Character:** คู่สองภาษาที่ล็อกไว้ — เซริฟอบอุ่นสำหรับอารมณ์ห้องหลังค่ำ และซานส์สะอาดสำหรับ UI/ฟอร์ม รายละเอียดเต็มใน `docs/TYPOGRAPHY.md`

### Hierarchy
- **Display** (400, `clamp(2rem, 4.2vw, 2.75rem)`, 1.15): สโลแกน auth และหัวข้อบรรยากาศห้อง
- **Brand** (400, `1.35rem`, 1): ชื่อ TogetherSpace บนหน้า auth
- **Title** (600, `1.2rem`, 1.35): หัวการ์ดฟอร์ม
- **Body** (400, `1rem`, 1.55): เนื้อหาทั่วไป
- **Body SM** (400, `0.95rem`, 1.6): คำอธิบายรองบน auth
- **Label** (600, `0.875rem`, 1.4): ป้ายฟอร์ม
- **Mark** (700, `0.75rem`, 1): ตัวอักษรใน brand mark

### Named Rules
**The Quiet Display Rule.** Instrument Serif + Taviraj สำรองไว้กับประโยคสั้นที่มีน้ำหนักอารมณ์ ไม่ใช้กับตารางหรือป้ายฟอร์ม

**The Matched Pair Rule.** อังกฤษกับไทยต้องใช้คู่ที่ล็อกเท่านั้น — Display = Instrument Serif/Taviraj · UI = DM Sans/Anuphan

## Layout

Auth landing เป็น split ~45/55 ตั้งแต่ `960px`: ซ้ายแบรนด์ (สัญญาณฮีโร่) + สโลแกน + ฟอร์ม, ขวาเป็น vignette ห้องหลังค่ำชิ้นเดียว (ไม่ซ้อนการ์ดไทล์) จอเล็กซ้อนแนวตั้งและให้ฟอร์มมาก่อน คอลัมน์ฟอร์มประมาณ `26–27rem`

จังหวะซ้าย: แบรนด์แยกด้านบน · สโลแกนกับฟอร์มห่าง `2–2.25rem` · ในกลุ่มสโลแกนแน่น `0.75rem` · ในฟอร์ม `1.25rem`

แอปภายในใช้ sidebar + page shell, จังหวะช่องว่างหลักประมาณ `0.5–1.5rem`, ความหนาแน่นปานกลาง — หรูด้วยลมหายใจ

## Elevation & Depth

ความลึกมาจากเงาโคมนุ่มๆ บนพื้นผิวเรียบ: พาเนลและฟอร์มการ์ดใช้เงาที่มี offset + blur และมีรัศมีอบอุ่นจางๆ จาก amber ไม่พึ่ง glow ศูนย์กลางหรือเงาแข็ง

### Shadow Vocabulary
- **Lamp Panel** (`box-shadow: 0 12px 32px rgb(8 10 24 / 0.5), 0 0 40px rgb(232 160 85 / 0.08)`): การ์ดฟอร์ม auth และ panel หลัก
- **Focus Ring Soft** (`0 0 0 3px` mix ของ primary ~22%): ขอบโฟกัสช่องกรอก

### Named Rules
**The Warm Lamp Shadow Rule.** เงาหลักต้องรู้สึกอบอุ่นและนุ่ม ไม่ดำสนิทหรือนีออน

## Shapes

มุมโค้งนุ่มสม่ำเสมอ: control `0.75rem`, panel `1rem`, auth card ~`1.1rem`, brand mark `0.625rem`, badge เป็นเม็ดยา `999px` ขอบบางสี Door Line — ไม่ใช้มุมแหลมหรือ neobrutal offset

## Components

บุคลิกคอมโพเนนต์: **หรู เงียบสงบ** — ไม่ฉูดฉาด ไม่เล่นเทคนิคมาก

### Buttons
- **Shape:** มุมโค้ง control (`0.75rem`), ความสูงขั้นต่ำ `2.25rem`
- **Primary:** Lamp Amber พื้น + primary-text เข้ม; hover เป็น Lamp Amber Hover
- **Default:** surface + ขอบ Door Line; hover เป็น hover surface
- **Danger:** error พื้น + ตัวอักษรเข้ม
- **Focus:** outline `2px` สี focus + offset `2px`

### Chips / Badges
- **Style:** muted-surface พื้น, text-muted ตัวอักษร, มุมเม็ดยา
- **Use:** ป้ายสถานะ/ประเภทที่ไม่แย่งแสงโคม

### Cards / Containers
- **Corner Style:** panel radius (`1rem`) หรือ auth card ~`1.1rem`
- **Background:** surface หรือ surface โปร่งเล็กน้อยบน auth
- **Shadow Strategy:** Lamp Panel
- **Border:** `1px` Door Line
- **Internal Padding:** ~`1.25–1.5rem`

### Inputs / Fields
- **Style:** surface พื้น, Door Line ขอบ, control radius
- **Focus:** ขอบ focus + soft ring amber จาง
- **Error:** error surface / border / text ชุดที่กำหนดในโทเคน

### Navigation
- Sidebar โทน sidebar / sidebar-hover; รายการที่เลือกใช้ primary อย่างประหยัดตาม Lamp Light Rule

### Signature: Auth Waves
- คลื่นพื้นหลัง auth: horizon Night Wall, wave mid `#1A2744`, crest Lamp Amber — บรรยากาศห้อง ไม่ใช่เอฟเฟกต์นีออน

## Do's and Don'ts

### Do:
- **Do** ใช้ Sofa Cream สำหรับข้อความยาวบนพื้นมืด
- **Do** เก็บ Lamp Amber ไว้กับปุ่มและจุดสนใจ
- **Do** ใช้เงาโคมนุ่มๆ กับพาเนลสำคัญ
- **Do** รักษา split auth ซ้ายสโลแกน+ฟอร์ม / ขวาพรีวิวบนเดสก์ท็อป

### Don't:
- **Don't** กลับไปธีม teal หรือม่วงนีออน
- **Don't** ใช้ amber เป็นย่อหน้ายาว
- **Don't** ทำพื้นขาวสว่างทั้งหน้า auth
- **Don't** ใส่การ์ดสถิติ/โปรโมตรกฝั่งซ้ายของ login
- **Don't** ใช้เงาแข็ง offset หรือ glow สว่างเกินไปจนเสียความเงียบสงบ
