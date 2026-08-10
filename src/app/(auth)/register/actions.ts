"use server";

import { redirect } from "next/navigation";

import { mapSignupAuthError } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";

export type SignupState = {
  error?: string;
  fieldErrors?: {
    username?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

/** ตรวจข้อมูล สมัครสมาชิก และส่งผู้ใช้ไปหน้าถัดไปหลังสมัครสำเร็จ */
export async function signup(
  _previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  void _previousState;

  const result = signupSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const nextUrl = (formData.get("next") as string) || "/dashboard";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        username: result.data.username,
      },
    },
  });

  if (error) {
    return mapSignupAuthError(error);
  }

  if (data.session) {
    redirect(nextUrl);
  }

  return {
    error:
      "เราได้รับข้อมูลแล้ว โปรดเปิดอีเมลของคุณแล้วกดยืนยันบัญชี จากนั้นกลับมาเข้าสู่ระบบได้เลย",
  };
}
