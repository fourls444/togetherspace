import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TogetherSpace",
  description: "พื้นที่ร่วมกันสำหรับคนสำคัญ",
};

/** วางโครง HTML หลักและตั้งค่าฟอนต์ที่ทุกหน้าของแอปใช้ร่วมกัน */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
