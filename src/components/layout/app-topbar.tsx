"use client";

import Link from "next/link";
import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

import {
  AccountMenu,
  type AccountMenuUser,
} from "@/components/layout/account-menu";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import styles from "@/components/layout/app-topbar.module.css";

type AppTopbarProps = {
  account: AccountMenuUser;
};

const ROOM_THEME_ROOT_VARS = [
  "--color-background",
  "--color-border",
  "--color-border-strong",
  "--color-focus",
  "--color-hover",
  "--color-muted-surface",
  "--color-placeholder",
  "--color-primary",
  "--color-primary-hover",
  "--color-primary-soft",
  "--color-primary-text",
  "--color-sidebar",
  "--color-sidebar-hover",
  "--color-surface",
  "--color-text",
  "--color-text-muted",
] as const;

export function AppTopbar({ account }: AppTopbarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";

  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const name of ROOM_THEME_ROOT_VARS) {
      root.style.removeProperty(name);
    }
    delete root.dataset.roomTheme;
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.brandCluster}>
        <SidebarToggle />
        <Link className={styles.brand} href="/dashboard" prefetch>
          <span className={styles.brandMark} aria-hidden>
            TS
          </span>
          <span className={styles.brandName}>TogetherSpace</span>
        </Link>
      </div>
      <div className={styles.actions}>
        <Link
          className={`${styles.homeLink} ${isHome ? styles.homeLinkActive : ""}`}
          href="/dashboard"
          prefetch
        >
          หน้าแรก
        </Link>
        <AccountMenu user={account} />
      </div>
    </header>
  );
}
