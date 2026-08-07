import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/** ส่งทุก request ที่ matcher เลือกไปตรวจและต่ออายุ Supabase session */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
