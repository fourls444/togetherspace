type SupabaseEnvironment = {
  url: string | undefined;
  publishableKey: string | undefined;
};

/** ตรวจและคืนค่า Supabase environment ที่พร้อมนำไปสร้าง client */
export function getSupabaseEnv(environment: SupabaseEnvironment) {
  const url = environment.url?.trim().replace(/\/+$/, "");
  const publishableKey = environment.publishableKey?.trim();

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
  }

  return { url, publishableKey };
}

/** อ่านค่า Supabase ฝั่ง public จาก process environment ของแอป */
export function getPublicSupabaseEnv() {
  return getSupabaseEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
