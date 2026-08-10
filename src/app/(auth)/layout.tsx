import { Suspense, type ReactNode } from "react";

import { AuthExperience } from "@/components/auth/auth-experience";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <AuthExperience />
      </Suspense>
    </>
  );
}
