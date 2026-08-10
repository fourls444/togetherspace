import type { PropsWithChildren } from "react";

import { AppAtmosphere } from "@/components/layout/app-atmosphere";
import { AppTopbar } from "@/components/layout/app-topbar";
import { NavProgress } from "@/components/layout/nav-progress";
import styles from "@/components/layout/app-shell.module.css";

export type AppAccount = {
  displayName: string;
  avatarUrl: string | null;
};

type AppShellProps = PropsWithChildren<{
  account: AppAccount;
}>;

/** เปลือกแอปหลังล็อกอิน — Living Room After Dark */
export function AppShell({ account, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <AppAtmosphere />
      <NavProgress />
      <AppTopbar account={account} />
      <div className={styles.main}>{children}</div>
    </div>
  );
}
