"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import styles from "@/components/layout/nav-progress.module.css";

/** แถบบางๆ ระหว่างรอหน้าใหม่ — ไม่ล้างเนื้อหาทิ้งทั้งจอ */
export function NavProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.origin !== window.location.origin) return;
      if (anchor.pathname === pathname && anchor.search === window.location.search) {
        return;
      }
      setPending(true);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  if (!pending) return null;
  return <div className={styles.bar} aria-hidden />;
}
