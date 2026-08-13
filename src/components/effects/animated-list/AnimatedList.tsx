"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import "./AnimatedList.css";

function AnimatedItem({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4, once: false });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="animated-list__item"
      data-index={index}
      ref={ref}
      role="listitem"
      initial={reduceMotion ? false : { scale: 0.94, opacity: 0 }}
      animate={
        reduceMotion || inView
          ? { scale: 1, opacity: 1 }
          : { scale: 0.94, opacity: 0.28 }
      }
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

type AnimatedListProps = {
  children: ReactNode;
  className?: string;
  showGradients?: boolean;
  displayScrollbar?: boolean;
};

export default function AnimatedList({
  children,
  className = "",
  showGradients = true,
  displayScrollbar = false,
}: AnimatedListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(0);

  const updateGradients = useCallback((target: HTMLDivElement) => {
    const { scrollTop, scrollHeight, clientHeight } = target;
    const overflow = scrollHeight - clientHeight;
    if (overflow <= 1) {
      setTopGradientOpacity(0);
      setBottomGradientOpacity(0);
      return;
    }
    setTopGradientOpacity(Math.min(scrollTop / 48, 1));
    const bottomDistance = overflow - scrollTop;
    setBottomGradientOpacity(Math.min(bottomDistance / 48, 1));
  }, []);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      updateGradients(event.currentTarget);
    },
    [updateGradients],
  );

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    updateGradients(node);
  }, [children, updateGradients]);

  const nodes = Children.toArray(children);

  return (
    <div className={`animated-list${className ? ` ${className}` : ""}`}>
      <div
        className={`animated-list__scroller${displayScrollbar ? "" : " animated-list__scroller--bare"}`}
        onScroll={handleScroll}
        ref={listRef}
        role="list"
      >
        {nodes.map((child, index) => (
          <AnimatedItem index={index} key={index}>
            {child}
          </AnimatedItem>
        ))}
      </div>
      {showGradients ? (
        <>
          <div
            aria-hidden
            className="animated-list__fade animated-list__fade--top"
            style={{ opacity: topGradientOpacity }}
          />
          <div
            aria-hidden
            className="animated-list__fade animated-list__fade--bottom"
            style={{ opacity: bottomGradientOpacity }}
          />
        </>
      ) : null}
    </div>
  );
}
