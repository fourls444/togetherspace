"use client";

import Link from "next/link";
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

export function AppTopbar({ account }: AppTopbarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard";

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
