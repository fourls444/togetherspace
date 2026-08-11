"use client";

import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { saveAlbumPhotos } from "@/features/albums/actions";
import { createClient } from "@/lib/supabase/client";
import {
  createImageObjectPath,
  getImageUploadBucket,
} from "@/lib/uploads/image-upload";

import styles from "./album.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type AlbumUploaderProps = {
  currentUserId: string;
  roomCode: string;
  roomId: string;
};

type UploadedPhoto = {
  imageUrl: string;
  storagePath: string;
};

/** คืนวันที่วันนี้ในรูปแบบ yyyy-mm-dd เพื่อใช้เป็นค่าเริ่มต้นของช่องวันที่ */
function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

/** ตรวจว่าไฟล์เป็นรูปที่รองรับและไม่เกินขนาดที่กำหนด */
function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "รูปต้องมีขนาดไม่เกิน 10MB ต่อไฟล์";
  }

  return null;
}

/** แสดงปุ่มอัปโหลดรูปและ modal สำหรับอัปโหลดหลายรูปเข้าอัลบั้ม */
export function AlbumUploader({
  currentUserId,
  roomCode,
  roomId,
}: AlbumUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [isUploadingStorage, setIsUploadingStorage] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const pending = isUploadingStorage || isSaving;

  /** อัปโหลดไฟล์ขึ้น Storage ก่อน แล้วส่ง metadata ไปบันทึกในฐานข้อมูล */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);
    setServerError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = Array.from(fileInputRef.current?.files ?? []);

    if (!files.length) {
      setClientError("กรุณาเลือกรูปอย่างน้อย 1 รูป");
      return;
    }

    if (files.length > 20) {
      setClientError("อัปโหลดได้สูงสุดครั้งละ 20 รูป");
      return;
    }

    const invalidFile = files.find((file) => validateImageFile(file));
    if (invalidFile) {
      setClientError(validateImageFile(invalidFile));
      return;
    }

    const supabase = createClient();
    const bucket = getImageUploadBucket("album");
    const uploadedPhotos: UploadedPhoto[] = [];
    setIsUploadingStorage(true);
    setUploadProgress({ completed: 0, total: files.length });

    for (const [index, file] of files.entries()) {
      const storagePath = createImageObjectPath({
        kind: "album",
        roomId,
        timestamp: Date.now() + index,
        userId: currentUserId,
      });
      const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        setClientError("อัปโหลดรูปไม่สำเร็จ: " + error.message);
        if (uploadedPhotos.length) {
          await supabase.storage
            .from(bucket)
            .remove(uploadedPhotos.map((photo) => photo.storagePath));
        }
        setIsUploadingStorage(false);
        setUploadProgress(null);
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      uploadedPhotos.push({
        imageUrl: data.publicUrl,
        storagePath,
      });
      setUploadProgress({ completed: index + 1, total: files.length });
    }

    setIsUploadingStorage(false);

    const payload = new FormData();
    payload.set("roomId", roomId);
    payload.set("roomCode", roomCode);
    payload.set("caption", String(formData.get("caption") ?? ""));
    payload.set("takenAt", String(formData.get("takenAt") ?? ""));
    payload.set("photosJson", JSON.stringify(uploadedPhotos));

    startSavingTransition(async () => {
      const result = await saveAlbumPhotos({}, payload);
      if (result.error || result.fieldErrors) {
        await supabase.storage
          .from(bucket)
          .remove(uploadedPhotos.map((photo) => photo.storagePath));
        setServerError(
          result.error ??
            result.fieldErrors?.photosJson?.[0] ??
            result.fieldErrors?.takenAt?.[0] ??
            result.fieldErrors?.caption?.[0] ??
            "บันทึกรูปไม่สำเร็จ",
        );
        setUploadProgress(null);
        return;
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
      setSelectedFileCount(0);
      setUploadProgress(null);
      setToast("อัปโหลดรูปเรียบร้อยแล้ว");
    });
  }

  return (
    <div className={styles.uploadDock}>
      <Button onClick={() => setOpen(true)} type="button" variant="primary">
        อัปโหลดภาพ
      </Button>

      {open ? (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!pending) setOpen(false);
          }}
          role="presentation"
        >
          <form
            className={styles.uploadModal}
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>เพิ่มรูปใหม่</p>
                <h2 className={styles.sectionTitle}>อัปโหลดเข้าอัลบั้ม</h2>
                <p className={styles.muted}>
                  เลือกหลายรูปได้ในครั้งเดียว รูปจะถูกเรียงตามลำดับที่เลือก
                </p>
              </div>
              <button
                aria-label="ปิดหน้าต่างอัปโหลด"
                className={styles.closeButton}
                disabled={pending}
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <label className={styles.uploadDropzone}>
              <input
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                multiple
                name="photos"
                onChange={(event) =>
                  setSelectedFileCount(event.currentTarget.files?.length ?? 0)
                }
                ref={fileInputRef}
                type="file"
              />
              <span className={styles.uploadIcon}>＋</span>
              <strong>เลือกรูปหลายรูป</strong>
              <small>
                JPG, PNG หรือ WebP สูงสุด 20 รูปต่อครั้ง ·{" "}
                {selectedFileCount
                  ? `เลือกแล้ว ${selectedFileCount} รูป`
                  : "ยังไม่ได้เลือกรูป"}
              </small>
            </label>

            <label className={styles.field}>
              <span>วันที่ของรูป</span>
              <input
                defaultValue={getTodayInputValue()}
                name="takenAt"
                type="date"
              />
              <small>ถ้าไม่เลือกวันที่ ระบบจะใช้วันที่อัปโหลดให้อัตโนมัติ</small>
            </label>

            <label className={styles.field}>
              <span>คำบรรยายรวม (ไม่บังคับ)</span>
              <textarea
                maxLength={280}
                name="caption"
                placeholder="เช่น ทริปทะเลกับเพื่อน"
                rows={3}
              />
            </label>

            {clientError || serverError ? (
              <p className={styles.error}>{clientError ?? serverError}</p>
            ) : null}
            {pending ? (
              <p className={styles.uploadStatus}>
                {isUploadingStorage && uploadProgress
                  ? `กำลังอัปโหลด ${uploadProgress.completed} / ${uploadProgress.total} รูป`
                  : "กำลังบันทึกรูปลงอัลบั้ม…"}
              </p>
            ) : null}

            <Button
              pending={pending}
              pendingText="กำลังอัปโหลด..."
              type="submit"
              variant="primary"
            >
              อัปโหลดรูป
            </Button>
          </form>
        </div>
      ) : null}
      <Toast
        message={toast}
        onDismiss={() => setToast(null)}
        tone="success"
      />
    </div>
  );
}
