"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { SignupForm } from "@/app/(auth)/register/signup-form";
import { AuthFloatingLinesBackground } from "@/components/auth/auth-floating-lines-background";
import { AuthWavesBackground } from "@/components/auth/auth-waves-background";
import styles from "@/components/auth/auth-shell.module.css";
import {
  AUTH_GLOW_COLOR,
  MagicBentoCard,
  MagicBentoSpotlight,
} from "@/components/effects/magic-bento/MagicBentoCard";
import { Button } from "@/components/ui/button";
import formStyles from "@/components/ui/form.module.css";

const ROOM_MOMENTS = [
  "สร้างและเข้าร่วมห้องด้วยกัน",
  "เชิญคนสำคัญด้วยลิงก์",
  "เก็บพื้นที่ร่วมไว้อบอุ่น",
];

type AuthMode = "login" | "register" | "forgot";

const COPY: Record<
  AuthMode,
  {
    title: string;
    description: string;
    slogan: string;
    sloganSupport: string;
    switchPrompt: string;
    switchLabel: string;
  }
> = {
  login: {
    title: "เข้าสู่ระบบ",
    description: "ใช้อีเมลและรหัสผ่านเพื่อกลับไปยังพื้นที่ของคุณ",
    slogan: "อยู่ด้วยกัน ครบในที่เดียว",
    sloganSupport:
      "สร้างห้องสำหรับเพื่อน แฟน หรือครอบครัว แล้วเก็บความทรงจำไว้ด้วยกัน",
    switchPrompt: "ยังไม่มีบัญชี?",
    switchLabel: "สมัครสมาชิก",
  },
  register: {
    title: "สมัครสมาชิก",
    description: "สร้างบัญชีเพื่อเริ่มพื้นที่ร่วมกับคนสำคัญ",
    slogan: "เริ่มต้นพื้นที่ของคุณ",
    sloganSupport:
      "สมัครครั้งเดียว แล้วสร้างหรือเข้าร่วมห้องได้ทันทีจากลิงก์เชิญ",
    switchPrompt: "มีบัญชีแล้ว?",
    switchLabel: "เข้าสู่ระบบ",
  },
  forgot: {
    title: "ลืมรหัสผ่าน",
    description:
      "เราอยากพาคุณกลับเข้าห้องอย่างนุ่มนวล ฟีเจอร์ส่งลิงก์รีเซ็ตกำลังเตรียมให้อยู่",
    slogan: "ไม่เป็นไร เราช่วยได้",
    sloganSupport:
      "ในระหว่างนี้ลองเข้าสู่ระบบด้วยรหัสผ่านเดิม หรือสมัครใหม่หากยังไม่มีบัญชี",
    switchPrompt: "จำรหัสผ่านได้แล้ว?",
    switchLabel: "เข้าสู่ระบบ",
  },
};

function modeFromPath(pathname: string): AuthMode {
  if (pathname.startsWith("/register")) return "register";
  if (pathname.startsWith("/forgot-password")) return "forgot";
  return "login";
}

function withNextQuery(path: string, next: string | null) {
  if (!next) return path;
  return `${path}?next=${encodeURIComponent(next)}`;
}

export function AuthExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeMode = modeFromPath(pathname);
  const nextParam = searchParams.get("next");

  const [visibleMode, setVisibleMode] = useState<AuthMode>(routeMode);
  const [panelAnim, setPanelAnim] = useState(styles.panelEnter);
  const [sloganAnim, setSloganAnim] = useState(styles.sloganEnter);
  const [switching, setSwitching] = useState(false);
  const isFirstRender = useRef(true);
  const visibleModeRef = useRef(visibleMode);
  const bentoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    visibleModeRef.current = visibleMode;
  }, [visibleMode]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (routeMode === visibleModeRef.current) return;

    const goingToRegister = routeMode === "register";
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      const timer = window.setTimeout(() => {
        setVisibleMode(routeMode);
        setPanelAnim(styles.panelEnter);
        setSloganAnim(styles.sloganEnter);
        setSwitching(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let enterTimer: number | undefined;
    const exitTimer = window.setTimeout(() => {
      setSwitching(true);
      setPanelAnim(
        goingToRegister ? styles.panelExitRight : styles.panelExitLeft,
      );
      setSloganAnim(styles.sloganExit);

      enterTimer = window.setTimeout(() => {
        setVisibleMode(routeMode);
        setPanelAnim(
          goingToRegister ? styles.panelEnterExpand : styles.panelEnterFromRight,
        );
        setSloganAnim(styles.sloganEnter);
        setSwitching(false);
      }, 320);
    }, 0);

    return () => {
      window.clearTimeout(exitTimer);
      if (enterTimer) window.clearTimeout(enterTimer);
    };
  }, [routeMode]);

  const copy = COPY[visibleMode];

  function handleSwitch() {
    if (switching) return;
    if (visibleMode === "forgot") {
      router.push(withNextQuery("/login", nextParam), { scroll: false });
      return;
    }
    const nextPath =
      visibleMode === "login"
        ? withNextQuery("/register", nextParam)
        : withNextQuery("/login", nextParam);
    router.push(nextPath, { scroll: false });
  }

  const roomCopy = (
    <div className={styles.roomContent}>
      <p className={styles.roomTitle}>ห้องหลังค่ำของเรา</p>
      <p className={styles.roomText}>
        พื้นที่เงียบสงบสำหรับเพื่อน แฟน หรือครอบครัว
        เริ่มจากสร้างห้องและเชิญคนสำคัญเข้ามาด้วยกัน
      </p>
      <ul className={styles.roomList}>
        {ROOM_MOMENTS.map((item) => (
          <li key={item} className={styles.roomItem}>
            <span className={styles.roomDot} aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <main
      className={`${styles.page} ${visibleMode === "register" ? styles.pageRegister : ""}`}
    >
      <div className={styles.waves} aria-hidden>
        <AuthWavesBackground />
      </div>
      <div
        ref={bentoSectionRef}
        className={`${styles.grid} magic-bento-section`}
      >
        <MagicBentoSpotlight
          sectionRef={bentoSectionRef}
          glowColor={AUTH_GLOW_COLOR}
          spotlightRadius={300}
        />
        <section className={styles.left} aria-label={copy.title}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden>
              TS
            </span>
            <span className={styles.brandName}>TogetherSpace</span>
          </Link>

          {visibleMode !== "register" ? (
            <div className={styles.mobileAtmosphere}>
              <div className={styles.mobileAtmosphereInner}>
                <div className={styles.lampGlow} aria-hidden />
                {roomCopy}
              </div>
            </div>
          ) : null}

          <div className={styles.leftStack}>
            <div className={`${styles.sloganBlock} ${sloganAnim}`}>
              <h1 className={styles.slogan}>{copy.slogan}</h1>
              {visibleMode === "register" ? null : (
                <p className={styles.sloganSupport}>{copy.sloganSupport}</p>
              )}
            </div>

            <MagicBentoCard
              className={`${styles.card} ${panelAnim}`}
              glowColor={AUTH_GLOW_COLOR}
              enableStars
              enableBorderGlow
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={false}
              particleCount={10}
            >
              <div className={styles.cardIntro}>
                <h2 className={styles.cardTitle}>{copy.title}</h2>
                {visibleMode === "register" ? null : (
                  <p className={styles.cardDescription}>{copy.description}</p>
                )}
              </div>

              {visibleMode === "login" ? <LoginForm /> : null}
              {visibleMode === "register" ? <SignupForm /> : null}
              {visibleMode === "forgot" ? (
                <p className={styles.cardDescription}>
                  เมื่อพร้อมแล้ว กดปุ่มด้านล่างเพื่อกลับไปเข้าสู่ระบบได้เลย
                </p>
              ) : null}

              <div className={styles.switchAccount}>
                {visibleMode === "forgot" ? (
                  <Link
                    className={formStyles.textLink}
                    href={withNextQuery("/register", nextParam)}
                  >
                    สมัครสมาชิก
                  </Link>
                ) : (
                  <p>{copy.switchPrompt}</p>
                )}
                <Button
                  type="button"
                  variant="default"
                  disabled={switching}
                  onClick={handleSwitch}
                >
                  {copy.switchLabel}
                </Button>
              </div>
            </MagicBentoCard>
          </div>
        </section>

        <section className={styles.right} aria-label="ภาพบรรยากาศห้อง">
          <MagicBentoCard
            className={styles.roomStage}
            glowColor={AUTH_GLOW_COLOR}
            enableStars={false}
            enableBorderGlow
            enableTilt={false}
            enableMagnetism={false}
            clickEffect={false}
            particleCount={0}
          >
            <div className={styles.roomLines} aria-hidden>
              <AuthFloatingLinesBackground />
            </div>
            <div className={styles.lampGlow} aria-hidden />
            {roomCopy}
          </MagicBentoCard>
        </section>
      </div>
    </main>
  );
}
