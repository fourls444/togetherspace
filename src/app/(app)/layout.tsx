import type { PropsWithChildren } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireAppUser } from "@/lib/rooms/sidebar";

/** โครงแอปหลังล็อกอิน — โหลดโปรไฟล์สำหรับปุ่มบัญชี */
export default async function AppLayout({ children }: PropsWithChildren) {
  const { supabase, userId } = await requireAppUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const displayName =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    "บัญชี";

  return (
    <AppShell
      account={{
        displayName,
        avatarUrl: profile?.avatar_url?.trim() || null,
      }}
    >
      {children}
    </AppShell>
  );
}
