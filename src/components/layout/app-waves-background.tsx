"use client";

import dynamic from "next/dynamic";

const GradientWaves = dynamic(() => import("@/components/effects/GradientWaves"), {
  ssr: false,
});

/** พื้นหลังคลื่นหน้าแอป — detail ต่ำเพื่อให้คงอยู่ข้ามหน้าโดยไม่กิน GPU */
export function AppWavesBackground() {
  return (
    <GradientWaves
      horizonColor="#0a0908"
      waveColor="#141210"
      crestColor="#c9b896"
      speed={0.28}
      amplitude={2.4}
      waveScale={0.58}
      waveRatio={0.9}
      swell={32}
      turbulence={14}
      tilt={1.08}
      zoom={0.95}
      height={5.0}
      fogDepth={12}
      detail="low"
      brightness={1.0}
      opacity={0.85}
      mouseInteraction={false}
      parallaxStrength={0.2}
      grain={false}
      maxDpr={1}
    />
  );
}
