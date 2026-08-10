import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve("."),
  },
  experimental: {
    // จำหน้า dynamic ไว้ฝั่ง client ~30 วิ — สลับไป-กลับไม่ต้องรอ server ใหม่ทุกครั้ง
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
