import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** แสดงหน้า Login เฉพาะผู้ที่ยังไม่มี session และส่งสมาชิกกลับ Dashboard */
export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) redirect("/dashboard");

  return (
    <AuthShell
      description="เข้าสู่ระบบเพื่อกลับไปยังพื้นที่ของคุณ"
      switchHref="/signup"
      switchLabel="สมัครสมาชิก"
      switchPrompt="ยังไม่มีบัญชี?"
      title="เข้าสู่ระบบ"
    >
      <LoginForm />
    </AuthShell>
  );
}
