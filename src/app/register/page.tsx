import { redirect } from "next/navigation";

import { SignupForm } from "@/app/register/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  return (
    <AuthShell
      description="สร้างบัญชีเพื่อเริ่มสร้างพื้นที่ร่วมกัน"
      switchHref="/login"
      switchLabel="เข้าสู่ระบบ"
      switchPrompt="มีบัญชีแล้ว?"
      title="สมัครสมาชิก"
    >
      <SignupForm />
    </AuthShell>
  );
}
