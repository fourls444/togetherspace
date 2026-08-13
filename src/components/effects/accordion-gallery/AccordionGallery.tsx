"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { gsap } from "gsap";

import "./AccordionGallery.css";

export type AccordionGalleryItem = {
  image: string;
  label?: string;
  link?: string;
  alt?: string;
};

type AccordionGalleryProps = {
  items: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number | "fill";
  gap?: number;
  radius?: number;
  expandRatio?: number;
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  trigger?: "hover" | "click";
  showLabels?: boolean;
  grayscale?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function AccordionGallery({
  items,
  defaultIndex = 0,
  accentColor = "var(--color-primary)",
  overlayColor = "var(--color-background)",
  textColor = "var(--color-text)",
  height = "fill",
  gap = 8,
  radius = 12,
  expandRatio = 0.52,
  duration = 0.55,
  ease = "power3.out",
  parallax = 0.25,
  tilt = 0,
  stagger = 0.06,
  trigger = "hover",
  showLabels = true,
  grayscale = false,
  className = "",
  ariaLabel = "รูปล่าสุด",
}: AccordionGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLElement | null)[]>([]);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(320);

  const count = items.length;
  const [active, setActive] = useState(() =>
    count === 0 ? 0 : Math.min(Math.max(defaultIndex, 0), count - 1),
  );

  const applyLayout = useCallback(
    (shouldAnimate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ratio = Math.min(Math.max(expandRatio, 0.2), 0.9);
      const grow = count > 1 ? (ratio * (count - 1)) / (1 - ratio) : 1;
      const mediaSize = mediaSizeRef.current;

      tlRef.current?.kill();
      const dur = shouldAnimate && !prefersReduced ? duration : 0;
      const tl = gsap.timeline();

      panels.forEach((panel, index) => {
        if (!panel) return;
        const isActive = index === active;
        const media = mediaRefs.current[index];
        const bar = barRefs.current[index];
        const text = textRefs.current[index];
        const rot = isActive ? 0 : index < active ? tilt : -tilt;

        tl.to(
          panel,
          { flexGrow: isActive ? grow : 1, rotateY: rot, duration: dur, ease },
          0,
        );

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - index));
          const shift = drift * parallax * mediaSize * 0.06;
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: isActive ? 0 : shift,
              y: 0,
              "--ag-gray": grayscale ? (isActive ? 0 : 1) : 0,
              "--ag-dim": isActive ? 0 : 0.22,
              duration: dur,
              ease,
            } as gsap.TweenVars,
            0,
          );
        }

        if (showLabels && bar && text) {
          if (isActive) {
            tl.to(
              [bar, text],
              {
                opacity: 1,
                x: 0,
                duration: dur,
                ease,
                stagger: prefersReduced ? 0 : stagger,
              },
              0,
            );
          } else {
            tl.to(
              [bar, text],
              { opacity: 0, x: -14, duration: dur * 0.6, ease },
              0,
            );
          }
        }
      });

      tlRef.current = tl;
    },
    [
      active,
      count,
      duration,
      ease,
      expandRatio,
      grayscale,
      parallax,
      showLabels,
      stagger,
      tilt,
    ],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el || count === 0) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const usable = Math.max(rect.width - gap * (count - 1), 120);
      const size = Math.max(
        140,
        usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22,
      );
      mediaSizeRef.current = size;
      el.style.setProperty("--ag-media-size", `${size}px`);
      applyLayout(!firstRunRef.current);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [applyLayout, count, expandRatio, gap]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    [],
  );

  const handleEnter = (index: number) => {
    if (trigger === "hover") setActive(index);
  };

  const handleClick = (index: number, event: MouseEvent<HTMLElement>) => {
    if (trigger === "click" && index !== active) {
      event.preventDefault();
      setActive(index);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index + 1) % count);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index - 1 + count) % count);
    }
  };

  if (count === 0) return null;

  const heightStyle: CSSProperties =
    height === "fill" ? { height: "100%" } : { height: `${height}px` };

  return (
    <div
      aria-label={ariaLabel}
      className={`accordion-gallery${className ? ` ${className}` : ""}`}
      ref={rootRef}
      role="list"
      style={
        {
          "--ag-accent": accentColor,
          "--ag-overlay": overlayColor,
          "--ag-text": textColor,
          "--ag-gap": `${gap}px`,
          "--ag-radius": `${radius}px`,
          ...heightStyle,
        } as CSSProperties
      }
    >
      {items.map((item, index) => {
        const isActive = index === active;
        const shared = {
          "aria-current": isActive ? ("true" as const) : undefined,
          "aria-label": item.label || item.alt || `รูปที่ ${index + 1}`,
          className: `ag-panel${isActive ? " ag-panel--active" : ""}`,
          onClick: (event: MouseEvent<HTMLElement>) => handleClick(index, event),
          onFocus: () => setActive(index),
          onKeyDown: (event: KeyboardEvent<HTMLElement>) =>
            handleKeyDown(index, event),
          onMouseEnter: () => handleEnter(index),
          ref: (node: HTMLElement | null) => {
            panelRefs.current[index] = node;
          },
          role: "listitem" as const,
          tabIndex: 0,
        };
        const inner = (
          <>
            <span className="ag-panel__frame">
              <span
                className="ag-panel__media"
                ref={(node) => {
                  mediaRefs.current[index] = node;
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={item.alt || item.label || ""}
                  draggable={false}
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                  src={item.image}
                />
              </span>
              <span aria-hidden className="ag-panel__overlay" />
            </span>
            {showLabels && item.label ? (
              <span aria-hidden className="ag-panel__label">
                <span
                  className="ag-panel__bar"
                  ref={(node) => {
                    barRefs.current[index] = node;
                  }}
                />
                <span
                  className="ag-panel__text"
                  ref={(node) => {
                    textRefs.current[index] = node;
                  }}
                >
                  {item.label}
                </span>
              </span>
            ) : null}
          </>
        );

        if (item.link) {
          return (
            <a {...shared} href={item.link} key={`${item.image}-${index}`}>
              {inner}
            </a>
          );
        }

        return (
          <div {...shared} key={`${item.image}-${index}`}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
