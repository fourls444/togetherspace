"use client";

import dynamic from "next/dynamic";

const GradientWaves = dynamic(() => import("@/components/effects/GradientWaves"), {
  ssr: false,
});

/** พื้นหลังคลื่นหน้า auth — หมึกอุ่น + crest แชมเปญ */
export function AuthWavesBackground() {
  return (
    <GradientWaves
      horizonColor="#0a0908"
      waveColor="#1a1714"
      crestColor="#c9b896"
      speed={0.38}
      amplitude={3.6}
      waveScale={0.72}
      waveRatio={0.95}
      swell={42}
      turbulence={24}
      tilt={1.05}
      zoom={0.92}
      height={4.4}
      fogDepth={9}
      detail="medium"
      brightness={1.25}
      opacity={1}
      mouseInteraction={false}
      parallaxStrength={0.35}
      grain
      grainIntensity={0.045}
    />
  );
}
