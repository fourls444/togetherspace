"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";

import "./LineSidebar.css";

const FALLOFF_CURVES = {
  linear: (p: number) => p,
  smooth: (p: number) => p * p * (3 - 2 * p),
  sharp: (p: number) => p * p * p,
};

export type LineSidebarItem = {
  href: string;
  label: string;
  compact?: "primary" | "more";
};

type LineSidebarProps = {
  items: LineSidebarItem[];
  footerItems?: LineSidebarItem[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: keyof typeof FALLOFF_CURVES;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  activeHref?: string | null;
  rail?: boolean;
  className?: string;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isCompactNav(rail: boolean) {
  if (rail) return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 63.99rem)").matches
  );
}

function compactSlot(
  item: LineSidebarItem,
  fallback: "primary" | "more",
): "primary" | "more" {
  return item.compact ?? fallback;
}

export default function LineSidebar({
  items,
  footerItems = [],
  accentColor = "var(--color-primary)",
  textColor = "var(--color-text-muted)",
  markerColor = "var(--color-border-strong)",
  showIndex = false,
  showMarker = true,
  proximityRadius = 200,
  maxShift = 32,
  falloff = "linear",
  markerLength = 52,
  markerGap = 12,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 18,
  fontSize,
  smoothing = 70,
  activeHref = null,
  rail = false,
  className = "",
}: LineSidebarProps) {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const smoothingRef = useRef(smoothing);
  const hoveringRef = useRef(false);
  const navRef = useRef<HTMLElement>(null);
  const [selectedHref, setSelectedHref] = useState(activeHref);

  const currentHref = activeHref ?? selectedHref;
  smoothingRef.current = smoothing;
  const moreItems = [
    ...items.filter((item) => compactSlot(item, "primary") === "more"),
    ...footerItems.filter((item) => compactSlot(item, "more") === "more"),
  ];
  const moreActive = moreItems.some((item) => item.href === currentHref);

  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const followMs = Math.max(smoothingRef.current, 1);
    const tau = (hoveringRef.current ? followMs : followMs * 2.4) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const nodes = itemRefs.current;
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (!el) continue;
      const target = targetsRef.current[i] || 0;
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.002;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty("--effect", value.toFixed(4));
      if (!settled) moving = true;
    }

    rafRef.current =
      moving || hoveringRef.current ? requestAnimationFrame(runFrame) : null;
  }, []);

  const ensureLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      if (prefersReducedMotion() || isCompactNav(rail)) return;
      hoveringRef.current = true;
      navRef.current?.classList.add("is-tracking");
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
      const pointerY = event.clientY;
      const nodes = itemRefs.current;
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(pointerY - center);
        targetsRef.current[i] = ease(
          Math.max(0, 1 - distance / proximityRadius),
        );
      }
      ensureLoop();
    },
    [ensureLoop, falloff, proximityRadius, rail],
  );

  const handlePointerLeave = useCallback(() => {
    hoveringRef.current = false;
    navRef.current?.classList.remove("is-tracking");
    targetsRef.current = targetsRef.current.map(() => 0);
    ensureLoop();
  }, [ensureLoop]);

  useEffect(() => {
    ensureLoop();
  }, [currentHref, ensureLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  function renderItem(
    item: LineSidebarItem,
    index: number,
    slot: "primary" | "more",
  ) {
    const isActive = currentHref === item.href;
    const compact = compactSlot(item, slot);

    return (
      <li
        className={`line-sidebar__item${isActive ? " is-active" : ""}${compact === "more" ? " line-sidebar__item--more" : ""}`}
        key={item.href}
        ref={(el) => {
          itemRefs.current[index] = el;
        }}
      >
        {showMarker ? (
          <span className="line-sidebar__marker" aria-hidden="true" />
        ) : null}
        <Link
          aria-current={isActive ? "page" : undefined}
          className="line-sidebar__hit"
          href={item.href}
          onClick={() => setSelectedHref(item.href)}
          prefetch
        >
          <span className="line-sidebar__label">
            {showIndex ? (
              <span className="line-sidebar__index">
                {String(index + 1).padStart(2, "0")}
              </span>
            ) : null}
            <span className="line-sidebar__text">{item.label}</span>
          </span>
        </Link>
      </li>
    );
  }

  return (
    <nav
      ref={navRef}
      aria-label="ในห้องนี้"
      className={`line-sidebar${showMarker ? " line-sidebar--markers" : ""}${scaleTick ? " line-sidebar--scale-tick" : ""}${rail ? " line-sidebar--rail" : ""}${className ? ` ${className}` : ""}`}
      style={
        {
          "--accent-color": accentColor,
          "--text-color": textColor,
          "--marker-color": markerColor,
          "--marker-length": `${markerLength}px`,
          "--marker-gap": `${markerGap}px`,
          "--tick-scale": tickScale,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
          ...(fontSize != null ? { "--font-size": `${fontSize}rem` } : {}),
          "--smoothing": `${smoothing}ms`,
        } as CSSProperties
      }
    >
      <ul
        className="line-sidebar__list"
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
      >
        {items.map((item, index) => renderItem(item, index, "primary"))}
      </ul>
      {footerItems.length > 0 ? (
        <ul
          className="line-sidebar__list line-sidebar__footer"
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
        >
          {footerItems.map((item, index) =>
            renderItem(item, items.length + index, "more"),
          )}
        </ul>
      ) : null}
      {moreItems.length > 0 ? (
        <details
          className={`line-sidebar__more${moreActive ? " is-active" : ""}`}
          open={moreActive}
        >
          <summary>เพิ่มเติม</summary>
          <ul className="line-sidebar__more-list">
            {moreItems.map((item) => {
              const isActive = currentHref === item.href;
              return (
                <li key={`more-${item.href}`}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`line-sidebar__more-link${isActive ? " is-active" : ""}`}
                    href={item.href}
                    onClick={() => setSelectedHref(item.href)}
                    prefetch
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </nav>
  );
}
