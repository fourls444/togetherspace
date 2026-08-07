"use server";

import { redirect } from "next/navigation";

import { mapLoginAuthError } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
};

/** ตรวจข้อมูล Login ฝั่ง server แล้วสร้าง session ก่อนส่งผู้ใช้ไป Dashboard */
export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return mapLoginAuthError(error);
  }

  redirect("/dashboard");
}
