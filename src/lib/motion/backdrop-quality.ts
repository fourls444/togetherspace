"use client";

import { useSyncExternalStore } from "react";

export type BackdropTier = "high" | "low" | "off";

export type BackdropQuality = {
  tier: BackdropTier;
  allowLightfall: boolean;
  allowIridescence: boolean;
  /** false = วาดเฟรมเดียวแล้วหยุด — ไหมยังอยู่ GPU ไม่กินต่อ */
  animateIridescence: boolean;
  dpr: number;
  fps: number;
};

const OFF: BackdropQuality = {
  tier: "off",
  allowLightfall: false,
  allowIridescence: false,
  animateIridescence: false,
  dpr: 0.4,
  fps: 12,
};

const LOW: BackdropQuality = {
  tier: "low",
  allowLightfall: false,
  allowIridescence: true,
  animateIridescence: false,
  dpr: 0.45,
  fps: 12,
};

const HIGH: BackdropQuality = {
  tier: "high",
  allowLightfall: true,
  allowIridescence: true,
  animateIridescence: true,
  dpr: 0.65,
  fps: 24,
};

let cached: BackdropQuality | null = null;

function readGpuRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", {
      powerPreference: "low-power",
      antialias: false,
    });
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "")
      : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return renderer;
  } catch {
    return "";
  }
}

function classifyBackdropQuality(): BackdropQuality {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return OFF;
  }

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  if (nav.connection?.saveData) return OFF;
  const network = nav.connection?.effectiveType;
  if (network === "slow-2g" || network === "2g") return OFF;

  const gpu = readGpuRenderer().toLowerCase();
  if (/swiftshader|llvmpipe|microsoft basic/.test(gpu)) return OFF;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const weakGpu = /intel|uhd|hd graphics|mali|adreno|powervr/.test(gpu);
  const lowRam =
    typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const fewCores =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4 &&
    !/apple|metal|nvidia|geforce|radeon|amd/.test(gpu);

  if (coarse || weakGpu || lowRam || fewCores) return LOW;
  return HIGH;
}

/** ตรวจครั้งเดียวต่อแท็บ — ไม่สร้าง WebGL ซ้ำ */
export function getBackdropQuality(): BackdropQuality {
  if (typeof window === "undefined") return OFF;
  if (!cached) cached = classifyBackdropQuality();
  return cached;
}

export function useBackdropQuality(): BackdropQuality | null {
  return useSyncExternalStore(
    () => () => {},
    getBackdropQuality,
    () => null,
  );
}
