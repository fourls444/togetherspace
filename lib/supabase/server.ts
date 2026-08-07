import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types/database";

/** สร้าง Supabase client ฝั่ง server ที่ใช้ cookies ของ request ปัจจุบัน */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getPublicSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      /** อ่าน cookies สำหรับแนบ session ไปกับคำขอ Supabase */
      getAll() {
        return cookieStore.getAll();
      },
      /** บันทึก cookies ใหม่เมื่อ context ปัจจุบันอนุญาตให้แก้ response */
      setAll(cookiesToSet, _headers) {
        void _headers;
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component เขียน cookies ไม่ได้ ส่วน Auth mutations ทำผ่าน
          // POST ที่ไม่ cache และ proxy จะใส่ anti-cache headers ตอนต่อ session
        }
      },
    },
  });
}
