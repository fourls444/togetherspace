"use client";

import {
  useEffect,
  useRef,
  type MouseEvent,
  type PropsWithChildren,
} from "react";

import styles from "@/components/effects/click-spark/ClickSpark.module.css";

type Spark = {
  angle: number;
  startTime: number;
  x: number;
  y: number;
};

type ClickSparkProps = PropsWithChildren<{
  sparkColor?: string;
}>;

const DURATION = 420;
const RADIUS = 22;

/** React Bits ClickSpark — ประกายโคมตอนคลิก */
export function ClickSpark({
  children,
  sparkColor = "#C9B896",
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  function draw(now: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = now - spark.startTime;
      if (elapsed >= DURATION) return false;
      const t = elapsed / DURATION;
      const eased = t * (2 - t);
      const distance = eased * RADIUS;
      const length = 10 * (1 - eased);
      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 1.75;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(
        spark.x + distance * Math.cos(spark.angle),
        spark.y + distance * Math.sin(spark.angle),
      );
      ctx.lineTo(
        spark.x + (distance + length) * Math.cos(spark.angle),
        spark.y + (distance + length) * Math.sin(spark.angle),
      );
      ctx.stroke();
      return true;
    });
    if (sparksRef.current.length > 0) {
      frameRef.current = requestAnimationFrame(draw);
    } else {
      frameRef.current = 0;
    }
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const now = performance.now();
    sparksRef.current.push(
      ...Array.from({ length: 9 }, (_, index) => ({
        angle: (2 * Math.PI * index) / 9,
        startTime: now,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })),
    );
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(draw);
    }
  }

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  return (
    <div className={styles.host} onClick={handleClick} ref={hostRef}>
      <canvas aria-hidden className={styles.canvas} ref={canvasRef} />
      {children}
    </div>
  );
}
