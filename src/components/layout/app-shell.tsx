import type { PropsWithChildren } from "react";

import { AppAtmosphere } from "@/components/layout/app-atmosphere";
import { AppMain } from "@/components/layout/app-main";
import { AppTopbar } from "@/components/layout/app-topbar";
import { NavProgress } from "@/components/layout/nav-progress";
import { RoomSidebarProvider } from "@/components/layout/room-sidebar-context";
import { ClickSpark } from "@/components/effects/click-spark/ClickSpark";
import { LampCursor } from "@/components/effects/lamp-cursor/LampCursor";
import styles from "@/components/layout/app-shell.module.css";

export type AppAccount = {
  displayName: string;
  avatarUrl: string | null;
};

type AppShellProps = PropsWithChildren<{
  account: AppAccount;
}>;

/** เปลือกแอปหลังล็อกอิน — Private Atelier */
export function AppShell({ account, children }: AppShellProps) {
  return (
    <RoomSidebarProvider>
      <ClickSpark sparkColor="#C9B896">
        <div className={styles.shell}>
          <AppAtmosphere />
          <LampCursor />
          <NavProgress />
          <AppTopbar account={account} />
          <AppMain>{children}</AppMain>
        </div>
      </ClickSpark>
    </RoomSidebarProvider>
  );
}
