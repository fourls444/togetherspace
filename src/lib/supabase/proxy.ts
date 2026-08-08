import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types/database";

function redirectWithSession(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  includeNextQuery = false,
) {
  const url = request.nextUrl.clone();
  if (includeNextQuery && request.nextUrl.pathname !== "/login") {
    url.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
  }
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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
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
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/rooms") ||
    pathname.startsWith("/profile");

  if (!isAuthenticated && isProtected) {
    return redirectWithSession(request, supabaseResponse, "/login", true);
  }

  if (
    isAuthenticated &&
    (pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/signup")
  ) {
    const nextUrl = request.nextUrl.searchParams.get("next") || "/dashboard";
    return redirectWithSession(request, supabaseResponse, nextUrl);
  }

  return supabaseResponse;
}
