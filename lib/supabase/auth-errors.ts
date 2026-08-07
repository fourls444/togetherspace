type AuthErrorLike = {
  code?: string;
  status?: number;
};

export type AuthFormError = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

/** แปลง error code จาก Supabase Signup เป็นข้อความของช่องฟอร์มหรือระบบ */
export function mapSignupAuthError(error: AuthErrorLike): AuthFormError {
  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return { fieldErrors: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] } };
    case "email_address_invalid":
    case "validation_failed":
      return { fieldErrors: { email: ["รูปแบบอีเมลไม่ถูกต้อง"] } };
    case "weak_password":
      return {
        fieldErrors: {
          password: ["รหัสผ่านไม่ผ่านเงื่อนไขความปลอดภัยของระบบ"],
        },
      };
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return { error: "มีการสมัครถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" };
    case "signup_disabled":
    case "email_provider_disabled":
      return { error: "ระบบยังไม่เปิดให้สมัครสมาชิกด้วยอีเมล" };
    default:
      return { error: "สมัครสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }
}

/** แปลง error code จาก Supabase Login โดยไม่เปิดเผยว่าบัญชีใดมีอยู่ในระบบ */
export function mapLoginAuthError(error: AuthErrorLike): AuthFormError {
  switch (error.code) {
    case "email_not_confirmed":
      return {
        fieldErrors: {
          email: [
            "บัญชีนี้ยังไม่ได้รับการยืนยัน ให้ผู้ดูแลปิด Confirm Email แล้วสร้างบัญชีใหม่",
          ],
        },
      };
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return { error: "มีการเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" };
    case "email_provider_disabled":
      return { error: "ระบบยังไม่เปิดให้เข้าสู่ระบบด้วยอีเมล" };
    case "invalid_credentials":
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    default:
      return { error: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }
}
