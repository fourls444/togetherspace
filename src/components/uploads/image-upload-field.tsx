"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  createImageObjectPath,
  getDefaultImageUrl,
  getImageUploadBucket,
  getStorageObjectFromPublicUrl,
  type ImageUploadKind,
} from "@/lib/uploads/image-upload";
import { createClient } from "@/lib/supabase/client";

import styles from "@/components/uploads/image-upload-field.module.css";

type ImageUploadFieldProps = {
  helperText?: string;
  hiddenInputName?: string;
  initialUrl: string | null;
  kind: ImageUploadKind;
  label: string;
  layout?: "inline" | "stacked";
  removeOldOnUpload?: boolean;
  roomId?: string;
};

type CropState = {
  fileName: string;
  imageUrl: string;
};

/** ครอปรูปจากตำแหน่งและซูมที่ผู้ใช้เลือก แล้วคืน blob สำหรับอัปโหลด */
async function cropImageToBlob(
  image: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  zoom: number,
) {
  const outputSize = 512;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("ไม่สามารถเตรียมพื้นที่ครอปรูปได้");

  const baseScale = Math.max(
    outputSize / image.naturalWidth,
    outputSize / image.naturalHeight,
  );
  const scale = baseScale * zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const movableX = Math.max(0, drawWidth - outputSize) / 2;
  const movableY = Math.max(0, drawHeight - outputSize) / 2;
  const drawX = (outputSize - drawWidth) / 2 + (offsetX / 100) * movableX;
  const drawY = (outputSize - drawHeight) / 2 + (offsetY / 100) * movableY;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("ครอปรูปไม่สำเร็จ"));
      },
      "image/webp",
      0.9,
    );
  });
}

/** สนามอัปโหลดรูปพร้อมครอป ใช้ซ้ำได้ทั้งโปรไฟล์ รูปห้อง และโปรไฟล์รายห้อง */
export function ImageUploadField({
  helperText,
  hiddenInputName = "avatarUrl",
  initialUrl,
  kind,
  label,
  layout = "inline",
  removeOldOnUpload = true,
  roomId,
}: ImageUploadFieldProps) {
  const fieldId = useId();
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [zoom, setZoom] = useState(1);
  const previewUrl = url || getDefaultImageUrl(kind);
  const usesProfileShape = kind === "profile" || kind === "roomProfile";

  /** ลบรูปเดิมจาก Storage เฉพาะกรณีที่ URL เป็นรูปของ bucket TogetherSpace */
  async function removeStoredImage(imageUrl: string | null) {
    const storageObject = getStorageObjectFromPublicUrl(imageUrl);
    if (!storageObject) return;

    const supabase = createClient();
    await supabase.storage
      .from(storageObject.bucket)
      .remove([storageObject.path]);
  }

  /** เปิด modal ครอปรูปหลังผู้ใช้เลือกไฟล์จากเครื่อง */
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกรูปภาพเท่านั้น");
      return;
    }

    setError(null);
    setStatus(null);
    setOffsetX(0);
    setOffsetY(0);
    setZoom(1);
    setCropState({
      fileName: file.name,
      imageUrl: URL.createObjectURL(file),
    });
  }

  /** ปิด modal และคืน object URL ให้ browser เพื่อไม่ให้ค้างในหน่วยความจำ */
  function closeCropper() {
    if (cropState) URL.revokeObjectURL(cropState.imageUrl);
    setCropState(null);
  }

  /** ครอปรูป แล้วอัปโหลดไป Supabase Storage bucket ที่ตรงกับชนิดรูป */
  async function uploadCroppedImage() {
    const image = imageRef.current;
    if (!image || !cropState) return;

    setIsUploading(true);
    setError(null);
    setStatus("กำลังเตรียมรูป…");

    try {
      const supabase = createClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userError || !userId)
        throw new Error("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป");

      const blob = await cropImageToBlob(image, offsetX, offsetY, zoom);
      const bucket = getImageUploadBucket(kind);
      const oldUrl = url;
      const objectPath = createImageObjectPath({
        kind,
        roomId,
        userId,
      });

      setStatus("กำลังอัปโหลดรูป…");
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, blob, {
          cacheControl: "3600",
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      setUrl(data.publicUrl);
      if (removeOldOnUpload) await removeStoredImage(oldUrl);
      setStatus("อัปโหลดรูปแล้ว กดบันทึกเพื่อใช้รูปนี้");
      closeCropper();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "อัปโหลดรูปไม่สำเร็จ",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      className={`${styles.field} ${layout === "stacked" ? styles.stacked : ""}`}
    >
      <input name={hiddenInputName} type="hidden" value={url} />
      <div className={styles.previewRow}>
        <div
          className={`${styles.preview} ${usesProfileShape ? styles.profileShape : ""}`}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={previewUrl} />
        </div>
        <div className={styles.controls}>
          <label className={styles.fileButton} htmlFor={fieldId}>
            {label}
            <input
              accept="image/png,image/jpeg,image/webp"
              id={fieldId}
              onChange={handleFileChange}
              type="file"
            />
          </label>
          {url ? (
            <Button
              onClick={async () => {
                setStatus("กำลังเอารูปออก…");
                if (removeOldOnUpload) await removeStoredImage(url);
                setUrl("");
                setStatus(
                  removeOldOnUpload
                    ? "เอารูปออกแล้ว กดบันทึกเพื่อใช้รูป default"
                    : "เลือกลบรูปแล้ว กดบันทึกเพื่อยืนยัน",
                );
              }}
              type="button"
            >
              เอารูปออก
            </Button>
          ) : null}
        </div>
      </div>
      {helperText ? <p className={styles.hint}>{helperText}</p> : null}
      {status ? <p className={styles.status}>{status}</p> : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {cropState ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div
            aria-labelledby={`${fieldId}-crop-title`}
            aria-modal="true"
            className={styles.modal}
            role="dialog"
          >
            <h2 className={styles.modalTitle} id={`${fieldId}-crop-title`}>
              ครอปรูปก่อนใช้
            </h2>
            <div
              className={`${styles.cropFrame} ${usesProfileShape ? styles.profileShape : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`ตัวอย่างรูป ${cropState.fileName}`}
                className={styles.cropImage}
                ref={imageRef}
                src={cropState.imageUrl}
                style={{
                  objectPosition: `${50 + offsetX / 2}% ${50 + offsetY / 2}%`,
                  transform: `scale(${zoom})`,
                }}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label className={styles.slider}>
                ซูม
                <input
                  max="2"
                  min="1"
                  onChange={(event) => setZoom(Number(event.target.value))}
                  step="0.05"
                  type="range"
                  value={zoom}
                />
              </label>
              <label className={styles.slider}>
                เลื่อนซ้าย/ขวา
                <input
                  max="100"
                  min="-100"
                  onChange={(event) => setOffsetX(Number(event.target.value))}
                  type="range"
                  value={offsetX}
                />
              </label>
              <label className={styles.slider}>
                เลื่อนขึ้น/ลง
                <input
                  max="100"
                  min="-100"
                  onChange={(event) => setOffsetY(Number(event.target.value))}
                  type="range"
                  value={offsetY}
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <Button
                disabled={isUploading}
                onClick={closeCropper}
                type="button"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={uploadCroppedImage}
                pending={isUploading}
                pendingText="กำลังอัปโหลด…"
                type="button"
                variant="primary"
              >
                ใช้รูปนี้
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
