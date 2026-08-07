import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types/database";

/** สร้าง redirect response โดยคง cookies และ anti-cache headers จาก Supabase */
function redirectWithSession(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirectResponse = NextResponse.redirect(url);

  response.cookies
    .getAll()
    .forEach((cookie) => redirectResponse.cookies.set(cookie));
  response.headers.forEach((value, key) =>
    redirectResponse.headers.set(key, value),
  );

  return redirectResponse;
}

/** ต่ออายุ session และป้องกัน routes ตามสถานะ Login ก่อนคำขอถึงหน้าแอป */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      /** อ่าน cookies จาก request เพื่อให้ Supabase ตรวจ session ปัจจุบัน */
      getAll() {
        return request.cookies.getAll();
      },
      /** เขียน cookies ที่ต่ออายุแล้วพร้อม headers ป้องกันการ cache ข้ามผู้ใช้ */
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/rooms");

  if (!isAuthenticated && isProtected) {
    return redirectWithSession(request, supabaseResponse, "/login");
  }

  if (isAuthenticated && pathname === "/login") {
    return redirectWithSession(request, supabaseResponse, "/dashboard");
  }

  return supabaseResponse;
}
