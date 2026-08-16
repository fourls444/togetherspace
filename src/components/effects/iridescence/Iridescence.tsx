"use client";

import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

import "./Iridescence.css";

export type IridescenceProps = {
  className?: string;
  color?: [number, number, number];
  /** พื้นหมึกที่ไหมผสมเข้าไป — ตามธีมห้อง ไม่ล็อก Atelier */
  ink?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  dpr?: number;
  targetFps?: number;
  /** ถ้า false วาดเฟรมเดียวแล้วหยุด */
  live?: boolean;
  /** silk = ไหมในห้อง; classic = shader ต้นฉบับ React Bits */
  variant?: "silk" | "classic";
};

const VERTEX = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const SILK_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uInk;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  vec2 uv = vUv.xy * 2.0 - 1.0;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  // การ์ดกว้างถ้ายืด UV ตามอัตราส่วนเต็ม จะแตกเป็นวงยับที่ขอบขวา
  uv.x *= min(max(aspect, 1.0), 1.42);
  uv.y *= min(max(1.0 / max(aspect, 0.0001), 1.0), 1.42);
  uv *= 0.92;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 wave = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  wave = cos(wave * cos(vec3(d, a, 2.5)) * 0.5 + 0.5);
  float l = dot(wave, vec3(0.22, 0.55, 0.23));
  l = pow(clamp(l, 0.0, 1.0), 1.45);
  vec3 ink = uInk;
  vec3 metal = uColor;
  vec3 sheen = mix(ink, metal, l * 0.78);
  sheen += metal * vec3(1.06, 1.02, 0.92) * pow(l, 7.0) * 0.28;
  gl_FragColor = vec4(sheen, 1.0);
}
`;

const CLASSIC_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** React Bits Iridescence — ผ้าไหมมุก ใช้ ogl */
export default function Iridescence({
  className,
  color = [0.788, 0.722, 0.588],
  ink = [0.039, 0.035, 0.031],
  speed = 0.45,
  amplitude = 0.1,
  mouseReact = false,
  dpr,
  targetFps,
  live = true,
  variant = "silk",
}: IridescenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorKey = `${color.join(",")}|${ink.join(",")}`;
  const classic = variant === "classic";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const pixelRatio =
      dpr ??
      (classic
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 0.7);
    const fps = targetFps ?? (classic ? 60 : 24);

    const renderer = new Renderer({
      dpr: pixelRatio,
      alpha: false,
      antialias: classic,
    });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const [metalPart, inkPart] = colorKey.split("|");
    const [cr, cg, cb] = metalPart.split(",").map(Number) as [
      number,
      number,
      number,
    ];
    const [ir, ig, ib] = inkPart.split(",").map(Number) as [
      number,
      number,
      number,
    ];
    gl.clearColor(classic ? 1 : ir, classic ? 1 : ig, classic ? 1 : ib, 1);
    const mouse = { x: 0.5, y: 0.5 };

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: classic ? CLASSIC_FRAGMENT : SILK_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(cr, cg, cb) },
        ...(classic
          ? {}
          : { uInk: { value: new Color(ir, ig, ib) } }),
        uResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ),
        },
        uMouse: { value: new Float32Array([mouse.x, mouse.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    const draw = (time: number) => {
      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      );
      if (!live) draw(0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let frame = 0;
    let lastDraw = 0;
    let visible = true;
    const minFrameMs = 1000 / Math.max(12, Math.min(60, fps));

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden || !visible) return;
      if (time - lastDraw < minFrameMs) return;
      lastDraw = time;
      draw(time);
    };

    if (live) {
      frame = requestAnimationFrame(loop);
    } else {
      draw(0);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        if (!live) return;
        if (visible && !document.hidden) {
          cancelAnimationFrame(frame);
          lastDraw = 0;
          frame = requestAnimationFrame(loop);
        }
      },
      { rootMargin: "40px" },
    );
    io.observe(container);

    const onVisibility = () => {
      if (!live) return;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        return;
      }
      if (!visible) return;
      lastDraw = 0;
      frame = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      program.uniforms.uMouse.value[0] = x;
      program.uniforms.uMouse.value[1] = y;
    };
    if (mouseReact) {
      const mouseTarget = classic ? window : container;
      mouseTarget.addEventListener("pointermove", onPointerMove);
    }

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (mouseReact) {
        const mouseTarget = classic ? window : container;
        mouseTarget.removeEventListener("pointermove", onPointerMove);
      }
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [amplitude, classic, colorKey, dpr, live, mouseReact, speed, targetFps]);

  return (
    <div
      className={`iridescence-container${className ? ` ${className}` : ""}`}
      ref={containerRef}
    />
  );
}
