"use server";

import { redirect } from "next/navigation";

import { mapSignupAuthError } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";

export type SignupState = {
  error?: string;
  fieldErrors?: {
    displayName?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

/** ตรวจข้อมูล สมัครสมาชิก และต้องได้รับ session ทันทีก่อนเปิด Dashboard */
export async function signup(
  _previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  void _previousState;

  const result = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { display_name: result.data.displayName },
    },
  });

  if (error) {
    return mapSignupAuthError(error);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    error:
      "Supabase ยังเปิด Confirm Email อยู่ บัญชีนี้อาจถูกสร้างแล้ว ให้ปิด Confirm Email และลบบัญชีที่ยังไม่ยืนยันก่อนสมัครใหม่",
  };
}
