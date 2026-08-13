"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { ImagePlus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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

type QueuedPhoto = {
  file: File;
  id: string;
  previewUrl: string;
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
  const selectedPhotosRef = useRef<QueuedPhoto[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [isUploadingStorage, setIsUploadingStorage] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<QueuedPhoto[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const pending = isUploadingStorage || isSaving;

  useEffect(() => {
    selectedPhotosRef.current = selectedPhotos;
  }, [selectedPhotos]);

  useEffect(() => {
    return () => {
      selectedPhotosRef.current.forEach((photo) =>
        URL.revokeObjectURL(photo.previewUrl),
      );
    };
  }, []);

  /** คืน object URL และล้างคิวรูปก่อนปิด modal หรือหลังอัปโหลดสำเร็จ */
  function clearQueue() {
    setSelectedPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /** สร้าง preview สำหรับไฟล์ที่เลือกและแทนคิวเดิมเพื่อให้ลบรูปก่อนอัปโหลดได้ */
  function handleFilesSelected(files: FileList | null) {
    const nextFiles = Array.from(files ?? []).slice(0, 20);
    setClientError(
      files && files.length > 20 ? "อัปโหลดได้สูงสุดครั้งละ 20 รูป" : null,
    );
    setSelectedPhotos((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return nextFiles.map((file, index) => ({
        file,
        id: `${file.name}-${file.lastModified}-${index}`,
        previewUrl: URL.createObjectURL(file),
      }));
    });
  }

  /** เอารูปออกจากคิวและคืน object URL ของรูปนั้น */
  function removeQueuedPhoto(photoId: string) {
    setSelectedPhotos((current) => {
      const removed = current.find((photo) => photo.id === photoId);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== photoId);
    });
  }

  /** อัปโหลดไฟล์ขึ้น Storage ก่อน แล้วส่ง metadata ไปบันทึกในฐานข้อมูล */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);
    setServerError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = selectedPhotos.map((photo) => photo.file);

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

      clearQueue();
      setOpen(false);
      setUploadProgress(null);
      setToast("อัปโหลดรูปเรียบร้อยแล้ว");
    });
  }

  return (
    <div className={styles.uploadDock}>
      <Button onClick={() => setOpen(true)} type="button" variant="primary">
        <ImagePlus aria-hidden size={17} /> อัปโหลดภาพ
      </Button>

      <Modal
        description="เลือกรูปได้สูงสุด 20 รูป ตรวจตัวอย่างก่อนอัปโหลด และเอารูปที่ไม่ต้องการออกจากคิวได้"
        isOpen={open}
        onClose={() => {
          if (!pending) {
            setOpen(false);
            clearQueue();
          }
        }}
        size="lg"
        title="อัปโหลดเข้าอัลบั้ม"
      >
        <form className={styles.uploadForm} onSubmit={handleSubmit}>
          <label className={styles.uploadDropzone}>
            <input
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              multiple
              name="photos"
              onChange={(event) =>
                handleFilesSelected(event.currentTarget.files)
              }
              ref={fileInputRef}
              type="file"
            />
            <span className={styles.uploadIcon}>
              <ImagePlus aria-hidden size={20} />
            </span>
            <strong>เลือกรูปหลายรูป</strong>
            <small>
              JPG, PNG หรือ WebP สูงสุด 20 รูปต่อครั้ง ·{" "}
              {selectedPhotos.length
                ? `เลือกแล้ว ${selectedPhotos.length} รูป`
                : "ยังไม่ได้เลือกรูป"}
            </small>
          </label>

          {selectedPhotos.length ? (
            <div className={styles.uploadPreviewSection}>
              <div className={styles.uploadPreviewHead}>
                <strong>ตัวอย่างก่อนอัปโหลด</strong>
                <span>{selectedPhotos.length} รูป</span>
              </div>
              <ul className={styles.uploadPreviewGrid}>
                {selectedPhotos.map((photo) => (
                  <li key={photo.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`ตัวอย่าง ${photo.file.name}`}
                      src={photo.previewUrl}
                    />
                    <span title={photo.file.name}>{photo.file.name}</span>
                    <button
                      aria-label={`เอา ${photo.file.name} ออกจากคิว`}
                      disabled={pending}
                      onClick={() => removeQueuedPhoto(photo.id)}
                      type="button"
                    >
                      <X aria-hidden size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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

          <div className={styles.uploadActions}>
            <Button
              disabled={pending}
              onClick={() => {
                clearQueue();
                setOpen(false);
              }}
              type="button"
            >
              <X aria-hidden size={16} /> ยกเลิก
            </Button>
            <Button
              disabled={!selectedPhotos.length}
              pending={pending}
              pendingText="กำลังอัปโหลด..."
              type="submit"
              variant="primary"
            >
              <Upload aria-hidden size={16} /> อัปโหลดรูป
            </Button>
          </div>
        </form>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} tone="success" />
    </div>
  );
}
