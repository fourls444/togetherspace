import { AuthShell } from "@/components/auth/auth-shell";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      description="กรุณาตรวจสอบกล่องข้อความในอีเมลของคุณเพื่อยืนยันการสมัครสมาชิก"
      switchHref="/login"
      switchLabel="เข้าสู่ระบบ"
      switchPrompt="ยืนยันอีเมลเรียบร้อยแล้ว?"
      title="ยืนยันอีเมล"
    >
      <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
        เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณเรียบร้อยแล้ว
      </p>
    </AuthShell>
  );
}
