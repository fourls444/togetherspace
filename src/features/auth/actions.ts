"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LogoutState = {
  error?: string;
};

export async function logout(
  _previousState: LogoutState,
): Promise<LogoutState> {
  void _previousState;
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }

  redirect("/login");
}
