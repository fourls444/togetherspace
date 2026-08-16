"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { readActiveRoomThemePortalProps } from "@/components/rooms/room-theme-provider";

import "./DraggableCard.css";
import "./album-print-toss.css";

const SPRING = {
  stiffness: 120,
  damping: 22,
  mass: 0.55,
};

const PICK_UP = {
  duration: 0.58,
  ease: [0.16, 1, 0.3, 1] as const,
};

const PUT_DOWN = {
  duration: 0.42,
  ease: [0.16, 1, 0.3, 1] as const,
};

const TOSS_STAGGER_S = 0.09;
const TOSS_SETTLE_S = 0.92;

const DRAG_BOUNDS = {
  bottom: 220,
  left: -240,
  right: 240,
  top: -220,
};

type DraggableCardBodyProps = {
  away?: boolean;
  children?: ReactNode;
  className?: string;
  dragEnabled?: boolean;
  label: string;
  onActivate?: (node: HTMLElement | null) => void;
  onLift?: () => void;
};

export function DraggableCardBody({
  away = false,
  children,
  className = "",
  dragEnabled = true,
  label,
  onActivate,
  onLift,
}: DraggableCardBodyProps) {
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

  const rotateX = useSpring(useTransform(mouseY, [-220, 220], [14, -14]), SPRING);
  const rotateY = useSpring(useTransform(mouseX, [-220, 220], [-16, 16]), SPRING);
  const glareOpacity = useSpring(
    useTransform(mouseX, [-220, 0, 220], [0.18, 0, 0.18]),
    SPRING,
  );

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || dragged.current || away) return;
    const box = cardRef.current?.getBoundingClientRect();
    if (!box) return;
    mouseX.set(event.clientX - (box.left + box.width / 2));
    mouseY.set(event.clientY - (box.top + box.height / 2));
  };

  const resetTilt = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const activate = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    resetTilt();
    onActivate?.(cardRef.current);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetTilt();
      onActivate?.(cardRef.current);
    }
  };

  return (
    <motion.div
      aria-hidden={away || undefined}
      aria-label={label}
      className={
        [
          "draggable-card-body",
          away ? "is-away" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")
      }
      drag={dragEnabled && !away}
      dragConstraints={DRAG_BOUNDS}
      dragElastic={0.38}
      dragMomentum={false}
      dragPropagation={false}
      onClick={activate}
      onDragEnd={(_, info) => {
        document.body.style.cursor = "";
        dragged.current = Math.hypot(info.offset.x, info.offset.y) > 8;
        resetTilt();
      }}
      onDragStart={() => {
        dragged.current = true;
        document.body.style.cursor = "grabbing";
        onLift?.();
      }}
      onKeyDown={onKeyDown}
      onMouseLeave={resetTilt}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      role="button"
      style={
        reduceMotion || away
          ? undefined
          : {
              rotateX,
              rotateY,
            }
      }
      tabIndex={away ? -1 : 0}
      whileHover={reduceMotion || away ? undefined : { scale: 1.02 }}
    >
      {children}
      {reduceMotion || away ? null : (
        <motion.span
          aria-hidden="true"
          className="draggable-card-glare"
          style={{ opacity: glareOpacity }}
        />
      )}
    </motion.div>
  );
}

export function DraggableCardContainer({
  ariaLabel,
  children,
  className = "",
  inspecting = false,
}: {
  ariaLabel: string;
  children?: ReactNode;
  className?: string;
  inspecting?: boolean;
}) {
  return (
    <div
      aria-hidden={inspecting || undefined}
      aria-label={ariaLabel}
      className={
        [
          "draggable-card-table",
          inspecting ? "is-inspecting" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {children}
    </div>
  );
}

export type PrintItem = {
  alt: string;
  caption?: string | null;
  id: string;
  image: string;
};

const SCATTER = [
  { left: "24%", top: "46%", rotate: "-16deg" },
  { left: "66%", top: "54%", rotate: "14deg" },
  { left: "48%", top: "42%", rotate: "18deg" },
  { left: "30%", top: "62%", rotate: "-11deg" },
  { left: "70%", top: "50%", rotate: "8deg" },
] as const;

const SINGLE = { left: "50%", top: "48%", rotate: "-6deg" };

const THROW = [
  { jitterX: 36, jitterY: -22, spin: -38 },
  { jitterX: -42, jitterY: 16, spin: 34 },
  { jitterX: 18, jitterY: -28, spin: 46 },
  { jitterX: -28, jitterY: 24, spin: -28 },
  { jitterX: 48, jitterY: -10, spin: 40 },
] as const;

const SINGLE_THROW = { jitterX: 14, jitterY: -16, spin: -22 };

function throwFor(index: number, count: number) {
  const next = count === 1 ? SINGLE_THROW : (THROW[index] ?? SINGLE_THROW);
  return {
    ...next,
    delay: (count - 1 - index) * TOSS_STAGGER_S,
  };
}

let liftOrder = 20;

function poseDegrees(pose: { rotate: string }) {
  return Number.parseFloat(pose.rotate) || 0;
}

type HeldPrint = {
  cx: number;
  cy: number;
  height: number;
  item: PrintItem;
  rotate: number;
  width: number;
};

function measureHeld(node: HTMLElement, rotate: number, item: PrintItem): HeldPrint {
  const box = node.getBoundingClientRect();
  return {
    cx: box.left + box.width / 2,
    cy: box.top + box.height / 2,
    height: node.offsetHeight,
    item,
    rotate,
    width: node.offsetWidth,
  };
}

function heldDestination(width: number, height: number) {
  const scale = Math.min(
    Math.min(window.innerWidth * 0.84, 32 * 16) / width,
    (window.innerHeight * 0.8) / height,
  );
  return {
    rotate: 0,
    scale,
    x: window.innerWidth / 2 - width / 2,
    y: window.innerHeight / 2 - height / 2,
  };
}

function PrintFace({
  caption,
  image,
}: {
  caption: string;
  image: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        className="draggable-card-photo"
        draggable={false}
        src={image}
      />
      {caption ? <span className="draggable-card-caption">{caption}</span> : null}
    </>
  );
}

function HeldPrintStage({
  held,
  onClose,
}: {
  held: HeldPrint;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const caption = held.item.caption?.trim() || "";
  const themePortal = readActiveRoomThemePortalProps();
  const from = useMemo(
    () => ({
      rotate: held.rotate,
      scale: 1,
      x: held.cx - held.width / 2,
      y: held.cy - held.height / 2,
    }),
    [held],
  );
  const to = useMemo(
    () => heldDestination(held.width, held.height),
    [held.height, held.width],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className="held-layer"
      data-room-theme={themePortal["data-room-theme"]}
      exit={{ opacity: 1, transition: PUT_DOWN }}
      initial={{ opacity: 1 }}
      style={themePortal.style}
    >
      <motion.button
        animate={{ opacity: 1 }}
        aria-label="วางรูปกลับกอง"
        className="held-veil"
        exit={{ opacity: 0, transition: PUT_DOWN }}
        initial={{ opacity: 0 }}
        onClick={onClose}
        transition={PICK_UP}
        type="button"
      />
      <motion.div
        animate={reduceMotion ? { ...to, opacity: 1 } : to}
        aria-label={caption || held.item.alt}
        aria-modal="true"
        className="draggable-card-body held-print"
        exit={
          reduceMotion
            ? { opacity: 0, transition: PUT_DOWN }
            : { ...from, transition: PUT_DOWN }
        }
        initial={reduceMotion ? { ...to, opacity: 0 } : from}
        onClick={onClose}
        role="dialog"
        style={{
          height: held.height,
          width: held.width,
        }}
        transition={reduceMotion ? { duration: 0.2 } : PICK_UP}
      >
        <PrintFace caption={caption} image={held.item.image} />
      </motion.div>
      <motion.button
        animate={{ opacity: 1 }}
        aria-label="ปิด"
        className="held-close"
        exit={{ opacity: 0, transition: PUT_DOWN }}
        initial={{ opacity: 0 }}
        onClick={onClose}
        ref={closeRef}
        transition={PICK_UP}
        type="button"
      >
        <X aria-hidden="true" size={18} strokeWidth={1.75} />
      </motion.button>
    </motion.div>
  );
}

function PrintFlight({
  delay,
  reduced,
  restRotate,
  throwing,
  toss,
  children,
}: {
  children: ReactNode;
  delay: number;
  reduced: boolean;
  restRotate: number;
  throwing: boolean;
  toss: ReturnType<typeof throwFor>;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const handRotate = toss.spin - restRotate;

  useLayoutEffect(() => {
    if (reduced) return;
    const node = measureRef.current;
    const table = node?.closest(".draggable-card-table");
    if (!node || !table) return;

    const tableBox = table.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const restX = box.left + box.width / 2;
    const restY = box.top + box.height / 2;

    setOrigin({
      x: tableBox.left + tableBox.width * 0.5 + toss.jitterX - restX,
      y: tableBox.top + 28 + toss.jitterY - restY,
    });
  }, [reduced, toss.jitterX, toss.jitterY]);

  if (reduced) return children;

  if (!origin) {
    return (
      <div className="album-print-flight" ref={measureRef} style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  const hand = {
    rotate: handRotate,
    scale: 1.04,
    x: origin.x,
    y: origin.y,
  };

  return (
    <motion.div
      animate={
        throwing
          ? { rotate: 0, scale: 1, x: 0, y: 0 }
          : hand
      }
      className="album-print-flight"
      initial={hand}
      transition={
        throwing
          ? {
              delay,
              rotate: { bounce: 0.18, duration: 0.92, type: "spring" },
              scale: { bounce: 0.12, duration: 0.62, type: "spring" },
              x: { bounce: 0.08, duration: 0.82, type: "spring" },
              y: { bounce: 0.28, duration: 0.78, type: "spring" },
            }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}

function AlbumPrint({
  away,
  dragEnabled,
  index,
  item,
  onActivate,
  pose,
  reduced,
  throwing,
  toss,
  zIndex,
}: {
  away: boolean;
  dragEnabled: boolean;
  index: number;
  item: PrintItem;
  onActivate: (item: PrintItem, index: number, node: HTMLElement | null) => void;
  pose: (typeof SCATTER)[number] | typeof SINGLE;
  reduced: boolean;
  throwing: boolean;
  toss: ReturnType<typeof throwFor>;
  zIndex: number;
}) {
  const [stack, setStack] = useState(zIndex);
  const caption = item.caption?.trim() || "";
  const label = caption ? `${caption} · ดูรูป` : `${item.alt} · ดูรูป`;

  return (
    <div
      className="draggable-card-slot"
      style={
        {
          "--print-left": pose.left,
          "--print-top": pose.top,
          "--print-rot": pose.rotate,
          zIndex: stack,
        } as CSSProperties
      }
    >
      <PrintFlight
        delay={toss.delay}
        reduced={reduced}
        restRotate={poseDegrees(pose)}
        throwing={throwing}
        toss={toss}
      >
        <DraggableCardBody
          away={away}
          dragEnabled={dragEnabled}
          label={label}
          onActivate={(node) => onActivate(item, index, node)}
          onLift={() => {
            liftOrder += 1;
            setStack(liftOrder);
          }}
        >
          <PrintFace caption={caption} image={item.image} />
        </DraggableCardBody>
      </PrintFlight>
    </div>
  );
}

export function AlbumPrints({
  ariaLabel = "รูปล่าสุดในอัลบั้ม",
  items,
}: {
  ariaLabel?: string;
  items: PrintItem[];
}) {
  const prints = items.filter((item) => item.image && item.id).slice(0, 5);
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, {
    amount: 0.12,
    margin: "100px 0px 0px 0px",
    once: true,
  });
  const [forceToss, setForceToss] = useState(false);
  const tossing = Boolean((inView || forceToss) && !reduceMotion);
  const [held, setHeld] = useState<HeldPrint | null>(null);
  const [awayId, setAwayId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dealt, setDealt] = useState(false);
  const closeHeld = useCallback(() => setHeld(null), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reduceMotion || inView) return;

    const id = window.setTimeout(() => {
      const node = stageRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const visible =
        rect.height > 0 &&
        rect.bottom > 48 &&
        rect.top < window.innerHeight - 48;
      if (visible) setForceToss(true);
    }, 700);

    return () => window.clearTimeout(id);
  }, [inView, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || prints.length === 0) {
      setDealt(true);
      return;
    }

    if (!tossing) return;

    setDealt(false);
    const id = window.setTimeout(
      () => setDealt(true),
      (TOSS_SETTLE_S + (prints.length - 1) * TOSS_STAGGER_S) * 1000 + 60,
    );
    return () => window.clearTimeout(id);
  }, [prints.length, reduceMotion, tossing]);

  if (prints.length === 0) return null;

  return (
    <>
      <div className="draggable-card-stage" ref={stageRef}>
        <DraggableCardContainer
          ariaLabel={ariaLabel}
          inspecting={Boolean(held || awayId)}
        >
        {prints.map((item, index) => (
          <AlbumPrint
            away={awayId === item.id}
            dragEnabled={dealt && !held && !awayId}
            index={index}
            item={item}
            key={item.id}
            onActivate={(next, _index, node) => {
              if (!node) return;
              const pose = prints.length === 1 ? SINGLE : (SCATTER[index] ?? SINGLE);
              setAwayId(next.id);
              setHeld(measureHeld(node, poseDegrees(pose), next));
            }}
            pose={prints.length === 1 ? SINGLE : (SCATTER[index] ?? SINGLE)}
            reduced={Boolean(reduceMotion)}
            throwing={tossing}
            toss={throwFor(index, prints.length)}
            zIndex={prints.length - index}
          />
        ))}
        </DraggableCardContainer>
      </div>
      {mounted
        ? createPortal(
            <AnimatePresence onExitComplete={() => setAwayId(null)}>
              {held ? (
                <HeldPrintStage
                  held={held}
                  key={held.item.id}
                  onClose={closeHeld}
                />
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
