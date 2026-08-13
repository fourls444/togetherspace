"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { gsap } from "gsap";

import "./DepthCarousel.css";

export type DepthCarouselItem = {
  alt?: string;
  image: string;
};

type DepthCarouselProps = {
  ariaLabel?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  blur?: number;
  cardHeight?: number;
  cardWidth?: number;
  className?: string;
  depth?: number;
  duration?: number;
  ease?: string;
  falloff?: number;
  items: DepthCarouselItem[];
  loop?: boolean;
  onActivate?: (item: DepthCarouselItem, index: number) => void;
  perspective?: number;
  radius?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  spread?: number;
  tilt?: number;
  tiltDirection?: "left" | "right";
  tint?: string;
  visibleCards?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** React Bits DepthCarousel — กองรูปมีมิติ สำหรับอัลบั้มบนหน้าห้อง */
export default function DepthCarousel({
  ariaLabel = "รูปล่าสุด",
  autoplay = false,
  autoplayDelay = 3200,
  blur = 6,
  cardHeight = 300,
  cardWidth = 240,
  className = "",
  depth = 180,
  duration = 480,
  ease = "power3.out",
  falloff = 0.2,
  items,
  loop = true,
  onActivate,
  perspective = 1400,
  radius = 6,
  showControls = true,
  showIndicators = true,
  spread = 72,
  tilt = 16,
  tiltDirection = "right",
  tint = "#0A0908",
  visibleCards = 4,
}: DepthCarouselProps) {
  const data = useMemo(
    () => (Array.isArray(items) ? items : []).filter((item) => item.image),
    [items],
  );
  const count = data.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const dragRef = useRef<{
    id: number;
    lastT: number;
    lastX: number;
    moved: boolean;
    startPos: number;
    v: number;
    x: number;
  } | null>(null);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedRef = useRef(false);
  const onActivateRef = useRef(onActivate);
  const [active, setActive] = useState(0);

  useEffect(() => {
    onActivateRef.current = onActivate;
  }, [onActivate]);

  const layout = useCallback(
    (pos: number) => {
      const dir = tiltDirection === "left" ? -1 : 1;
      const scale = scaleRef.current;
      for (let i = 0; i < count; i += 1) {
        const el = cardRefs.current[i];
        if (!el) continue;
        let delta = i - pos;
        if (loop && count > 1) {
          delta = ((delta % count) + count) % count;
          if (delta > count / 2) delta -= count;
        }
        const back = Math.max(0, delta);
        const shown = Math.abs(delta) <= visibleCards + 0.5;
        let opacity = delta < 0 ? Math.max(0, 1 + delta) : 1;
        if (!shown) opacity = 0;
        const brightness = Math.max(0.15, 1 - back * falloff);
        const blurPx = blur
          ? Math.min(blur, (back / Math.max(1, visibleCards)) * blur)
          : 0;
        el.style.transform = `translate(-50%, -50%) scale(${scale}) translateX(${(dir * spread * delta).toFixed(2)}px) translateZ(${(-depth * delta).toFixed(2)}px) rotateY(${(dir * tilt * clamp(delta, 0, 1)).toFixed(3)}deg)`;
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
        el.style.zIndex = String(Math.round(2000 - delta * 20));
        el.style.pointerEvents = shown && opacity > 0.05 ? "auto" : "none";
        const overlay = overlayRefs.current[i];
        if (overlay) {
          overlay.style.opacity = clamp(back * falloff * 1.2, 0, 0.86).toFixed(3);
        }
      }
    },
    [blur, count, depth, falloff, loop, spread, tilt, tiltDirection, visibleCards],
  );

  const tweenTo = useCallback(
    (target: number, animate: boolean) => {
      tweenRef.current?.kill();
      const proxy = { p: posRef.current };
      tweenRef.current = gsap.to(proxy, {
        duration: animate && !reducedRef.current ? duration / 1000 : 0,
        ease,
        onComplete: () => {
          if (count > 0) posRef.current = ((posRef.current % count) + count) % count;
          layout(posRef.current);
        },
        onUpdate: () => {
          posRef.current = proxy.p;
          layout(proxy.p);
        },
        p: target,
      });
    },
    [count, duration, ease, layout],
  );

  const setFocus = useCallback(
    (rawIndex: number, animate = true) => {
      if (!count) return;
      const idx = loop
        ? ((rawIndex % count) + count) % count
        : clamp(rawIndex, 0, count - 1);
      let delta = idx - posRef.current;
      if (loop && count > 1) {
        delta = ((delta % count) + count) % count;
        if (delta > count / 2) delta -= count;
      }
      tweenTo(posRef.current + delta, animate);
      if (idx !== focusRef.current) {
        focusRef.current = idx;
        setActive(idx);
      }
    },
    [count, loop, tweenTo],
  );

  const navigateBy = useCallback(
    (step: number) => setFocus(focusRef.current + step, true),
    [setFocus],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      const needed = cardWidth + Math.abs(spread) * 2 + 120;
      scaleRef.current = clamp(width / needed, 0.4, 1);
      layout(posRef.current);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [cardWidth, layout, spread]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (count < 2) return;
      if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) return;
      event.preventDefault();
      tweenRef.current?.kill();
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const delta = event.deltaMode === 1 ? raw * 24 : raw;
      posRef.current += clamp(delta / (cardWidth * 0.9), -0.6, 0.6);
      layout(posRef.current);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(
        () => setFocus(Math.round(posRef.current), true),
        130,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [cardWidth, count, layout, setFocus]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (count < 2) return;
      tweenRef.current?.kill();
      dragRef.current = {
        id: event.pointerId,
        lastT: performance.now(),
        lastX: event.clientX,
        moved: false,
        startPos: posRef.current,
        v: 0,
        x: event.clientX,
      };
    },
    [count],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const stepPx = Math.max(cardWidth * 0.55 * scaleRef.current, 40);
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true;
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (!drag.moved) return;
      const now = performance.now();
      const dt = Math.max(now - drag.lastT, 1);
      drag.v = (event.clientX - drag.lastX) / dt;
      drag.lastX = event.clientX;
      drag.lastT = now;
      posRef.current = drag.startPos - dx / stepPx;
      layout(posRef.current);
    },
    [cardWidth, layout],
  );

  const onPointerEnd = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    const stepPx = Math.max(cardWidth * 0.55 * scaleRef.current, 40);
    setFocus(Math.round(posRef.current - (drag.v * 180) / stepPx), true);
  }, [cardWidth, setFocus]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateBy(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateBy(1);
      } else if (event.key === "Enter" || event.key === " ") {
        const item = data[focusRef.current];
        if (!item) return;
        event.preventDefault();
        onActivateRef.current?.(item, focusRef.current);
      }
    },
    [data, navigateBy],
  );

  const onCardClick = useCallback(
    (index: number) => {
      if (dragRef.current?.moved) return;
      if (index === focusRef.current) {
        const item = data[index];
        if (item) onActivateRef.current?.(item, index);
        return;
      }
      setFocus(index, true);
    },
    [data, setFocus],
  );

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!autoplay || reducedRef.current || count < 2) return;
    const root = rootRef.current;
    let hovered = false;
    let focused = false;
    const stop = () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    const start = () => {
      stop();
      autoTimerRef.current = setInterval(() => {
        if (!hovered && !focused) navigateBy(1);
      }, Math.max(autoplayDelay, 600));
    };
    const onEnter = () => {
      hovered = true;
    };
    const onLeave = () => {
      hovered = false;
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = () => {
      focused = false;
    };
    root?.addEventListener("mouseenter", onEnter);
    root?.addEventListener("mouseleave", onLeave);
    root?.addEventListener("focusin", onFocusIn);
    root?.addEventListener("focusout", onFocusOut);
    start();
    return () => {
      stop();
      root?.removeEventListener("mouseenter", onEnter);
      root?.removeEventListener("mouseleave", onLeave);
      root?.removeEventListener("focusin", onFocusIn);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [autoplay, autoplayDelay, count, navigateBy]);

  useEffect(() => {
    layout(posRef.current);
  }, [cardHeight, layout, radius]);

  useEffect(
    () => () => {
      tweenRef.current?.kill();
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    },
    [],
  );

  if (count === 0) return null;

  return (
    <div
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className={className ? `depth-carousel ${className}` : "depth-carousel"}
      onKeyDown={onKeyDown}
      onPointerCancel={onPointerEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      ref={rootRef}
      role="group"
      style={
        {
          "--dc-perspective": `${perspective}px`,
        } as CSSProperties
      }
      tabIndex={0}
    >
      <div className="depth-carousel__stage">
        {data.map((item, index) => (
          <div
            aria-hidden={active !== index}
            aria-label={`${index + 1} จาก ${count}`}
            aria-roledescription="slide"
            className="depth-carousel__card"
            key={`${item.image}-${index}`}
            onClick={() => onCardClick(index)}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            style={{
              borderRadius: radius,
              height: cardHeight,
              width: cardWidth,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={item.alt || ""}
              className="depth-carousel__img"
              draggable={false}
              src={item.image}
            />
            <span
              className="depth-carousel__tint"
              ref={(node) => {
                overlayRefs.current[index] = node;
              }}
              style={{ background: tint }}
            />
          </div>
        ))}
      </div>
      {showControls && count > 1 ? (
        <>
          <button
            aria-label="รูปก่อนหน้า"
            className="depth-carousel__arrow depth-carousel__arrow--prev"
            onClick={() => navigateBy(-1)}
            type="button"
          >
            <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          <button
            aria-label="รูปถัดไป"
            className="depth-carousel__arrow depth-carousel__arrow--next"
            onClick={() => navigateBy(1)}
            type="button"
          >
            <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </>
      ) : null}
      {showIndicators && count > 1 ? (
        <div aria-label="สไลด์" className="depth-carousel__dots" role="tablist">
          {data.map((item, index) => (
            <button
              aria-label={`ไปรูปที่ ${index + 1}`}
              aria-selected={active === index}
              className={
                active === index
                  ? "depth-carousel__dot is-active"
                  : "depth-carousel__dot"
              }
              key={`dot-${item.image}-${index}`}
              onClick={() => setFocus(index, true)}
              role="tab"
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
