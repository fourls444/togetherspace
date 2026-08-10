"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
};

/** คัดลอกข้อความสั้น ๆ เช่น room code หรือ invite link และแสดงสถานะสำเร็จชั่วคราว */
export function CopyButton({
  text,
  label = "คัดลอก",
  copiedLabel = "คัดลอกแล้ว",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button onClick={handleCopy} type="button">
      {copied ? copiedLabel : label}
    </Button>
  );
}
