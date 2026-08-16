"use client";

import { Check } from "lucide-react";
import type { CSSProperties } from "react";

import styles from "@/components/rooms/room-theme.module.css";
import { useRoomTheme } from "@/components/rooms/room-theme-provider";
import type { RoomTheme } from "@/lib/rooms/themes";

/** สร้างพื้นตัวอย่างจากสีหลักของธีมโดยไม่เปลี่ยนหน้าจริงก่อนผู้ใช้เลือก */
function getPreviewStyle(theme: RoomTheme): CSSProperties {
  return {
    "--theme-preview-background": theme.palette.background,
    "--theme-preview-primary": theme.palette.primary,
    "--theme-preview-surface": theme.palette.surface,
  } as CSSProperties;
}

/** เลือกบรรยากาศของห้องจากสี่ขั้วที่ต่างกันชัด */
export function RoomThemeSelector() {
  const { currentTheme, selectTheme, themes } = useRoomTheme();

  return (
    <div>
      <p className={styles.selectorHint}>
        ใช้ได้เฉพาะในห้องนี้ แถบบนของเว็บไม่เปลี่ยน และจำไว้บนเครื่องนี้
      </p>
      <div className={styles.themeGrid} aria-label="ตัวเลือกธีมห้อง">
        {themes.map((theme) => {
          const isSelected = theme.id === currentTheme.id;
          return (
            <button
              aria-pressed={isSelected}
              className={styles.themeOption}
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              type="button"
            >
              <span
                className={styles.themePreview}
                style={getPreviewStyle(theme)}
              >
                <span />
                <span />
              </span>
              <span className={styles.themeCopy}>
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
              </span>
              {isSelected ? (
                <span className={styles.selectedMark} aria-label="กำลังใช้งาน">
                  <Check aria-hidden="true" size={15} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
