import type { Metadata } from "next";
import { Anuphan, Bodoni_Moda, Libre_Franklin, Taviraj } from "next/font/google";

import "@/styles/tokens.css";
import "@/styles/base.css";
import "leaflet/dist/leaflet.css";

const libreFranklin = Libre_Franklin({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const anuphan = Anuphan({
  variable: "--font-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

const bodoniModa = Bodoni_Moda({
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
  icons: {
    icon: "/images/favicon.ico",
  },
};

const DESIGN_CONTRACT = `<!--
THESIS: Private rooms for people you love, typeset like a house atelier — not a navy social app, not a neon dashboard.
OWN-WORLD: Warm ink, ivory type, champagne metal, Didone display, hairline rules, motion that barely moves.
STORY: This is a private house for your people; enter quietly, stay, invite.
FIRST VIEWPORT: Split auth — enormous serif slogan left, full-bleed vignette right; the app hub is ivory display on ink with one champagne action.
FORM: Luxury Serif, user-pinned; seed c27b4f3e unused.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${libreFranklin.variable} ${anuphan.variable} ${bodoniModa.variable} ${taviraj.variable}`}
    >
      <body>
        <span
          aria-hidden
          dangerouslySetInnerHTML={{ __html: DESIGN_CONTRACT }}
          hidden
        />
        {children}
      </body>
    </html>
  );
}
