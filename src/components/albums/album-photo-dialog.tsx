"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  deleteAlbumPhoto,
  updateAlbumPhoto,
} from "@/features/albums/actions";

import type { AlbumPhotoView } from "./album-photo-grid";
import styles from "./album.module.css";

type AlbumPhotoDialogProps = {
  canManage: boolean;
  onClose: () => void;
  onDeleted: (photoId: string) => void;
  onMove: (direction: "next" | "previous") => void;
  onUpdated: (photo: AlbumPhotoView) => void;
  open: boolean;
  photo: AlbumPhotoView | null;
  photoPosition: string;
  roomCode: string;
  roomId: string;
};

/** แสดงรูปขนาดใหญ่ พร้อมคำสั่งแก้ไขและลบตามสิทธิ์ของผู้ใช้ */
export function AlbumPhotoDialog({
  canManage,
  onClose,
  onDeleted,
  onMove,
  onUpdated,
  open,
  photo,
  photoPosition,
  roomCode,
  roomId,
}: AlbumPhotoDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [caption, setCaption] = useState(photo?.caption ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [takenAt, setTakenAt] = useState(photo?.taken_at ?? "");
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    /** ปิดหรือเลื่อนรูปด้วยคีย์บอร์ดโดยไม่รบกวนตอนกำลังบันทึก */
    function handleKeyDown(event: KeyboardEvent) {
      if (confirmDelete || isPending) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onMove("previous");
      if (event.key === "ArrowRight") onMove("next");
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [confirmDelete, isPending, onClose, onMove, open]);

  if (!open || !photo) return null;
  const currentPhoto = photo;

  /** บันทึกวันที่และคำบรรยายรูป แล้วอัปเดตข้อมูลที่แสดงทันที */
  function handleSave() {
    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("photoId", currentPhoto.id);
    formData.set("caption", caption);
    formData.set("takenAt", takenAt);

    startTransition(async () => {
      const result = await updateAlbumPhoto(formData);
      if (result.error) {
        setToast({ message: result.error, tone: "error" });
        return;
      }

      onUpdated({
        ...currentPhoto,
        caption: caption.trim() || null,
        taken_at: takenAt,
      });
      setToast({ message: "บันทึกรายละเอียดรูปแล้ว", tone: "success" });
    });
  }

  /** ลบรูปและปิด modal เมื่อทั้งข้อมูลและ Storage ถูกจัดการสำเร็จ */
  function handleDelete() {
    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("photoId", currentPhoto.id);
    formData.set("storagePath", currentPhoto.storage_path);

    startTransition(async () => {
      const result = await deleteAlbumPhoto(formData);
      if (result.error) {
        setConfirmDelete(false);
        setToast({ message: result.error, tone: "error" });
        return;
      }

      setConfirmDelete(false);
      onDeleted(currentPhoto.id);
      onClose();
    });
  }

  return (
    <div
      className={styles.photoDialogOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
      role="presentation"
    >
      <section
        aria-label="ดูรูปในอัลบั้ม"
        aria-modal="true"
        className={styles.photoDialog}
        ref={dialogRef}
        role="dialog"
      >
        <div className={styles.photoDialogBar}>
          <span>{photoPosition}</span>
          <Button
            disabled={isPending}
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ปิด
          </Button>
        </div>

        <div className={styles.photoStage}>
          <button
            aria-label="รูปก่อนหน้า"
            className={styles.photoArrow}
            onClick={() => onMove("previous")}
            type="button"
          >
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={currentPhoto.caption ?? "รูปในอัลบั้ม"}
            src={currentPhoto.image_url}
          />
          <button
            aria-label="รูปถัดไป"
            className={styles.photoArrow}
            onClick={() => onMove("next")}
            type="button"
          >
            ›
          </button>
        </div>

        {canManage ? (
          <div className={styles.photoEditor}>
            <label className={styles.field}>
              วันที่ของรูป
              <input
                onChange={(event) => setTakenAt(event.target.value)}
                required
                type="date"
                value={takenAt}
              />
            </label>
            <label className={styles.field}>
              คำบรรยาย
              <textarea
                maxLength={280}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="เพิ่มเรื่องราวสั้น ๆ ของรูปนี้"
                rows={3}
                value={caption}
              />
            </label>
            <div className={styles.photoEditorActions}>
              <Button
                disabled={isPending}
                onClick={() => setConfirmDelete(true)}
                type="button"
                variant="danger"
              >
                ลบรูป
              </Button>
              <Button
                onClick={handleSave}
                pending={isPending}
                pendingText="กำลังบันทึก…"
                type="button"
                variant="primary"
              >
                บันทึก
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.photoReadOnlyMeta}>
            <p>{currentPhoto.taken_at}</p>
            {currentPhoto.caption ? <h3>{currentPhoto.caption}</h3> : null}
          </div>
        )}
      </section>

      <ConfirmationDialog
        confirmLabel="ลบรูป"
        description="รูปนี้จะถูกลบออกจากอัลบั้มและ Storage โดยไม่สามารถกู้คืนได้"
        isPending={isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        open={confirmDelete}
        title="ลบรูปนี้ถาวร?"
        variant="danger"
      />
      <Toast
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        tone={toast?.tone}
      />
    </div>
  );
}
