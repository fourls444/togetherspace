import type { Metadata } from "next";
import { Anuphan, DM_Sans, Instrument_Serif, Taviraj } from "next/font/google";

import "@/styles/tokens.css";
import "@/styles/base.css";
import "leaflet/dist/leaflet.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const anuphan = Anuphan({
  variable: "--font-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const taviraj = Taviraj({
  variable: "--font-display-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
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
    <html
      lang="th"
      className={`${dmSans.variable} ${anuphan.variable} ${instrumentSerif.variable} ${taviraj.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
