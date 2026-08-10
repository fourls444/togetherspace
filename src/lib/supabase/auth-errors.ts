type AuthErrorLike = {
  code?: string;
  status?: number;
  message?: string;
};

function isInvalidApiKeyError(error: AuthErrorLike) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("invalid api key") ||
    message.includes("no api key found") ||
    error.code === "invalid_api_key"
  );
}

export type AuthFormError = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

/** แปลง error code จาก Supabase Signup เป็นข้อความอบอุ่นสำหรับผู้ใช้ */
export function mapSignupAuthError(error: AuthErrorLike): AuthFormError {
  if (isInvalidApiKeyError(error)) {
    return {
      error:
        "ระบบยังเชื่อมต่อกับเซิร์ฟเวอร์บัญชีไม่ได้ ขอให้เจ้าของโปรเจคตรวจ Publishable key ใน .env.local อีกครั้ง",
    };
  }

  switch (error.code) {
    case "email_exists":
    case "user_already_exists":
      return {
        fieldErrors: {
          email: ["อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทนได้เลย"],
        },
      };
    case "email_address_invalid":
    case "validation_failed":
      return { fieldErrors: { email: ["รูปแบบอีเมลยังไม่ถูกต้อง ลองตรวจอีกครั้งนะ"] } };
    case "weak_password":
      return {
        fieldErrors: {
          password: ["รหัสผ่านยังอ่อนไป ลองทำให้ยาวและเดายากขึ้นอีกนิด"],
        },
      };
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return { error: "มีการสมัครถี่ไปหน่อย พักสักครู่แล้วค่อยลองใหม่นะ" };
    case "signup_disabled":
    case "email_provider_disabled":
      return {
        error: "ตอนนี้ยังสมัครด้วยอีเมลไม่ได้ชั่วคราว ลองใหม่ภายหลังนะ",
      };
    default:
      return {
        error: "สมัครยังไม่สำเร็จ ลองใหม่อีกครั้ง หรือเปลี่ยนอีเมลดูได้",
      };
  }
}

/** แปลง error code จาก Supabase Login เป็นข้อความอบอุ่น โดยไม่เปิดเผยว่าบัญชีใดมีอยู่ */
export function mapLoginAuthError(error: AuthErrorLike): AuthFormError {
  if (isInvalidApiKeyError(error)) {
    return {
      error:
        "ระบบยังเชื่อมต่อกับเซิร์ฟเวอร์บัญชีไม่ได้ ขอให้เจ้าของโปรเจคตรวจ Publishable key ใน .env.local อีกครั้ง",
    };
  }

  switch (error.code) {
    case "email_not_confirmed":
      return {
        fieldErrors: {
          email: [
            "ยังไม่ได้ยืนยันอีเมล เปิดกล่องจดหมายแล้วกดลิงก์ยืนยัน จากนั้นกลับมาเข้าสู่ระบบได้เลย",
          ],
        },
      };
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return { error: "มีการเข้าสู่ระบบถี่ไปหน่อย พักสักครู่แล้วค่อยลองใหม่นะ" };
    case "email_provider_disabled":
      return {
        error: "ตอนนี้ยังเข้าสู่ระบบด้วยอีเมลไม่ได้ชั่วคราว ลองใหม่ภายหลังนะ",
      };
    case "invalid_credentials":
      return { error: "อีเมลหรือรหัสผ่านยังไม่ตรง ลองอีกครั้งนะ" };
    default:
      return { error: "เข้าสู่ระบบยังไม่สำเร็จ ลองใหม่อีกครั้งนะ" };
  }
}
