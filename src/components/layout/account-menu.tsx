"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { logout, type LogoutState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { getDefaultImageUrl } from "@/lib/uploads/image-upload";
import styles from "@/components/layout/account-menu.module.css";

const initialState: LogoutState = {};

export type AccountMenuUser = {
  displayName: string;
  avatarUrl: string | null;
};

type AccountMenuProps = {
  user: AccountMenuUser;
};

export function AccountMenu({ user }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [state, formAction, isPending] = useActionState(logout, initialState);
  const avatar = user.avatarUrl?.trim() || getDefaultImageUrl("profile");

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`บัญชีของ ${user.displayName}`}
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className={styles.avatarImage} src={avatar} />
      </button>
      {open ? (
        <div className={styles.menu} id={menuId} role="menu">
          <p className={styles.menuName}>{user.displayName}</p>
          <Link
            className={styles.item}
            href="/profile"
            onClick={() => setOpen(false)}
            prefetch
            role="menuitem"
          >
            แก้ไขโปรไฟล์
          </Link>
          <form action={formAction}>
            <Button
              className={styles.logout}
              pending={isPending}
              pendingText="กำลังออก…"
              type="submit"
            >
              ออกจากระบบ
            </Button>
          </form>
          {state.error ? (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
