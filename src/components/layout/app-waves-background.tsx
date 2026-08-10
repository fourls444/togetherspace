"use client";

import dynamic from "next/dynamic";

const GradientWaves = dynamic(() => import("@/components/effects/GradientWaves"), {
  ssr: false,
});

/** พื้นหลังคลื่นหน้าแอปหลังล็อกอิน — Living Room After Dark */
export function AppWavesBackground() {
  return (
    <GradientWaves
      horizonColor="#0d1424"
      waveColor="#151d31"
      crestColor="#e8a055"
      speed={0.32}
      amplitude={2.8}
      waveScale={0.58}
      waveRatio={0.9}
      swell={36}
      turbulence={18}
      tilt={1.08}
      zoom={0.95}
      height={5.0}
      fogDepth={12}
      detail="medium"
      brightness={1.05}
      opacity={0.9}
      mouseInteraction={false}
      parallaxStrength={0.25}
      grain
      grainIntensity={0.035}
    />
  );
}
