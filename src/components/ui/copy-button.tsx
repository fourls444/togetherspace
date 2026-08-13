"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
};

/** คัดลอกข้อความสั้นๆ เช่น room code หรือ invite link และแสดงสถานะสำเร็จชั่วคราว */
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
      {copied ? (
        <Check aria-hidden size={15} />
      ) : (
        <Copy aria-hidden size={15} />
      )}
      {copied ? copiedLabel : label}
    </Button>
  );
}
