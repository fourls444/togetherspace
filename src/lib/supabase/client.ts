import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types/database";

/** สร้าง Supabase client ฝั่ง browser สำหรับ Client Components */
export function createClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
