# Design brief — Auth landing + theme

ธีมล็อก: **Living Room After Dark** (ห้องน้ำเงินมืด + แสงโคมอุ่น + ข้อความครีม)  
เลย์เอาต์ login: split ซ้าย auth + สโลแกน / ขวาพรีวิว

## สี

| บทบาท | Hex |
|--------|-----|
| พื้นหลังแอป | `#0D1424` |
| พื้นการ์ด | `#151D31` |
| พื้นรอง | `#1C2540` |
| ข้อความหลัก | `#F3EDE3` |
| ข้อความรอง | `#A8B0C2` |
| ข้อความจาง | `#6F788F` |
| สีหลัก | `#E8A055` |
| สีหลัก hover | `#F0B56E` |
| สีหลักอ่อน | `#3A2A18` |
| ขอบ | `#2A334A` |
| ข้อความบนปุ่มหลัก | `#1A1208` |
| อันตราย | `#F08080` |

## คลื่นพื้นหลัง auth
- horizon `#0D1424`
- wave `#1A2744`
- crest `#E8A055`

## Typography (ล็อก)
| บทบาท | อังกฤษ | ไทย |
|--------|--------|-----|
| Display / สโลแกน | Instrument Serif | Taviraj |
| UI / Body | DM Sans | Anuphan |

รายละเอียด: `docs/TYPOGRAPHY.md` และ `DESIGN.md`

## Login / หลังกดลิงก์แล้วต้องเข้าสู่ระบบ
1. ซ้าย: TogetherSpace + สโลแกน + ฟอร์ม
2. ขวา: พรีวิวภาพรวมเว็บ
3. Desktop สองคอลัมน์ / Mobile ซ้อนแนวตั้ง

ไฟล์ที่ AI ต้องเคารพ:
- `.cursor/rules/togetherspace-product.mdc`
- `.cursor/rules/auth-landing-layout.mdc`
- `docs/TYPOGRAPHY.md`
- `AGENTS.md`
