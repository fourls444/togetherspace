"use client";

import dynamic from "next/dynamic";
import { memo } from "react";

import type { FloatingLinesProps } from "@/components/effects/floating-lines/FloatingLines";

const FloatingLines = dynamic(
  () => import("@/components/effects/floating-lines/FloatingLines"),
  { ssr: false },
);

const FLOATING_LINES_PROPS: FloatingLinesProps = {
  linesGradient: ["#8a7354", "#c9b896", "#d8cbb0", "#1c1a17"],
  enabledWaves: ["top", "middle", "bottom"],
  lineCount: [7, 10, 13],
  lineDistance: [7, 5, 4],
  animationSpeed: 0.72,
  interactive: true,
  bendRadius: 5,
  bendStrength: -0.4,
  parallax: true,
  parallaxStrength: 0.14,
  mixBlendMode: "screen",
};

/** เส้นลอยในแผงบรรยากาศขวาของหน้า auth — โทนหลอดไฟหลังค่ำ */
function AuthFloatingLinesBackgroundComponent() {
  return <FloatingLines {...FLOATING_LINES_PROPS} />;
}

export const AuthFloatingLinesBackground = memo(
  AuthFloatingLinesBackgroundComponent,
);
