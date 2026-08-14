"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import "./DraggableCard.css";

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

const TableRefContext = createContext<RefObject<HTMLDivElement | null> | null>(
  null,
);

type DraggableCardBodyProps = {
  away?: boolean;
  children?: ReactNode;
  className?: string;
  dragEnabled?: boolean;
  label: string;
  onActivate?: (node: HTMLButtonElement | null) => void;
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
  const tableRef = useContext(TableRefContext);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLButtonElement>(null);
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

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
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

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetTilt();
      onActivate?.(cardRef.current);
    }
  };

  return (
    <motion.button
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
      dragConstraints={tableRef ?? undefined}
      dragElastic={0.08}
      dragMomentum={false}
      onClick={activate}
      onDragEnd={(_, info) => {
        document.body.style.cursor = "";
        dragged.current = Math.hypot(info.offset.x, info.offset.y) > 6;
        resetTilt();
      }}
      onDragStart={() => {
        document.body.style.cursor = "grabbing";
        onLift?.();
      }}
      onKeyDown={onKeyDown}
      onMouseLeave={resetTilt}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={
        reduceMotion || away
          ? undefined
          : {
              rotateX,
              rotateY,
            }
      }
      tabIndex={away ? -1 : 0}
      type="button"
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
    </motion.button>
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
  const tableRef = useRef<HTMLDivElement>(null);

  return (
    <TableRefContext.Provider value={tableRef}>
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
        ref={tableRef}
      >
        {children}
      </div>
    </TableRefContext.Provider>
  );
}

export type PrintItem = {
  alt: string;
  caption?: string | null;
  id: string;
  image: string;
};

const SCATTER = [
  { x: "-16cqw", y: "-8cqh", rotate: "-8deg" },
  { x: "14cqw", y: "6cqh", rotate: "8deg" },
  { x: "2cqw", y: "-14cqh", rotate: "4deg" },
  { x: "-10cqw", y: "12cqh", rotate: "-5deg" },
  { x: "18cqw", y: "-2cqh", rotate: "10deg" },
] as const;

const SINGLE = { x: "0%", y: "0%", rotate: "-3deg" };

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
      exit={{ opacity: 1, transition: PUT_DOWN }}
      initial={{ opacity: 1 }}
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

function AlbumPrint({
  away,
  dragEnabled,
  index,
  item,
  onActivate,
  pose,
  zIndex,
}: {
  away: boolean;
  dragEnabled: boolean;
  index: number;
  item: PrintItem;
  onActivate: (item: PrintItem, index: number, node: HTMLButtonElement | null) => void;
  pose: (typeof SCATTER)[number] | typeof SINGLE;
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
          "--print-x": pose.x,
          "--print-y": pose.y,
          "--print-rot": pose.rotate,
          zIndex: stack,
        } as CSSProperties
      }
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
  const [held, setHeld] = useState<HeldPrint | null>(null);
  const [awayId, setAwayId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeHeld = useCallback(() => setHeld(null), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (prints.length === 0) return null;

  return (
    <>
      <DraggableCardContainer ariaLabel={ariaLabel} inspecting={Boolean(held || awayId)}>
        {prints.map((item, index) => (
          <AlbumPrint
            away={awayId === item.id}
            dragEnabled={!held && !awayId}
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
            zIndex={prints.length - index}
          />
        ))}
      </DraggableCardContainer>
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
