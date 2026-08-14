"use client";

import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

import "./Iridescence.css";

export type IridescenceProps = {
  className?: string;
  color?: [number, number, number];
  ink?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  dpr?: number;
  targetFps?: number;
  /** ถ้า false วาดเฟรมเดียวแล้วหยุด */
  live?: boolean;
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

const FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
uniform vec3 uInk;

varying vec2 vUv;

void main() {
  vec2 uv = vUv.xy * 2.0 - 1.0;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  uv.x *= min(aspect, 1.55);
  uv *= 0.82;

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
  sheen += metal * pow(l, 7.0) * 0.28;
  gl_FragColor = vec4(sheen, 1.0);
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
  dpr = 0.7,
  targetFps = 24,
  live = true,
}: IridescenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorKey = color.join(",");
  const inkKey = ink.join(",");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const renderer = new Renderer({
      dpr,
      alpha: false,
      antialias: false,
    });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const [cr, cg, cb] = colorKey.split(",").map(Number) as [
      number,
      number,
      number,
    ];
    const [ir, ig, ib] = inkKey.split(",").map(Number) as [
      number,
      number,
      number,
    ];
    gl.clearColor(ir, ig, ib, 1);
    const mouse = { x: 0.5, y: 0.5 };

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(cr, cg, cb) },
        uInk: { value: new Color(ir, ig, ib) },
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
    const minFrameMs = 1000 / Math.max(12, Math.min(60, targetFps));

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
      container.addEventListener("pointermove", onPointerMove);
    }

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (mouseReact) {
        container.removeEventListener("pointermove", onPointerMove);
      }
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [amplitude, colorKey, dpr, inkKey, live, mouseReact, speed, targetFps]);

  return (
    <div
      className={`iridescence-container${className ? ` ${className}` : ""}`}
      ref={containerRef}
    />
  );
}
