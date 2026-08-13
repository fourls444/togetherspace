"use client";

import type { ReactNode } from "react";

import SpecularButton, {
  type SpecularButtonProps,
} from "@/components/effects/specular-button/SpecularButton";

/** Private Atelier — ปุ่มหลักทึบ (แชมเปญ) + ขอบ specular */
export const SPECULAR_PRIMARY = {
  size: "md" as const,
  radius: 4,
  tint: "#C9B896",
  tintOpacity: 1,
  blur: 0,
  textColor: "#1A1612",
  lineColor: "#F6F1E8",
  baseColor: "#8A7354",
  intensity: 0.85,
  shineSize: 10,
  shineFade: 40,
  thickness: 1,
  speed: 0.18,
  followMouse: true,
  proximity: 240,
  autoAnimate: false,
};

/** ปุ่มรอง — พื้นหมึก + ขอบแชมเปญบาง */
export const SPECULAR_SECONDARY = {
  ...SPECULAR_PRIMARY,
  tint: "#141210",
  tintOpacity: 1,
  textColor: "#F6F1E8",
  lineColor: "#C9B896",
  baseColor: "#3D3933",
  intensity: 0.7,
  shineSize: 8,
  shineFade: 42,
};

type SpecularTone = "primary" | "secondary";

type SpecularCtaProps = Omit<
  SpecularButtonProps,
  "children" | "href" | "disabled"
> & {
  children: ReactNode;
  tone?: SpecularTone;
  pending?: boolean;
  pendingText?: string;
  disabled?: boolean;
};

/** ปุ่ม CTA สำคัญ — Specular + โทนห้องหลังค่ำ */
export function SpecularCta({
  children,
  tone = "primary",
  pending = false,
  pendingText = "กำลังดำเนินการ…",
  disabled,
  type = "submit",
  size,
  ...overrides
}: SpecularCtaProps) {
  const preset = tone === "primary" ? SPECULAR_PRIMARY : SPECULAR_SECONDARY;

  return (
    <SpecularButton
      {...preset}
      {...overrides}
      size={size ?? preset.size}
      type={type}
      disabled={disabled || pending}
    >
      {pending ? pendingText : children}
    </SpecularButton>
  );
}

type SpecularCtaLinkProps = Omit<
  SpecularButtonProps,
  "children" | "type" | "onClick" | "disabled"
> & {
  children: ReactNode;
  href: string;
  tone?: SpecularTone;
};

/** ลิงก์ CTA สำคัญ — ใช้ Specular เหมือนปุ่ม */
export function SpecularCtaLink({
  children,
  href,
  tone = "primary",
  size,
  ...overrides
}: SpecularCtaLinkProps) {
  const preset = tone === "primary" ? SPECULAR_PRIMARY : SPECULAR_SECONDARY;

  return (
    <SpecularButton
      {...preset}
      {...overrides}
      size={size ?? preset.size}
      href={href}
    >
      {children}
    </SpecularButton>
  );
}
