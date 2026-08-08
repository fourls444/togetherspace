import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "@/styles/tokens.css";
import "@/styles/base.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TogetherSpace",
  description: "พื้นที่ร่วมกันสำหรับคนสำคัญ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
