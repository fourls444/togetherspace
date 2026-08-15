"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";
import {
  Check,
  ImagePlus,
  Move,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Modal } from "@/components/ui/modal";
import {
  createImageObjectPath,
  getDefaultImageUrl,
  getImageUploadBucket,
  getStorageObjectFromPublicUrl,
  type ImageUploadKind,
} from "@/lib/uploads/image-upload";
import { getDraggedCropOffset } from "@/lib/uploads/crop-position";
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

type UploadStatus = {
  detail?: string;
  title: string;
};

type DragState = {
  pointerId: number;
  startOffsetX: number;
  startOffsetY: number;
  startX: number;
  startY: number;
};

type PinchState = {
  distance: number;
  zoom: number;
};

/** วาดภาพลง canvas ด้วยตำแหน่งและซูมชุดเดียวกับไฟล์ผลลัพธ์ */
function drawCropToCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  zoom: number,
) {
  const outputSize = 512;
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

  context.clearRect(0, 0, outputSize, outputSize);
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

/** ครอปรูปจากตำแหน่งและซูมที่ผู้ใช้เลือก แล้วคืน blob สำหรับอัปโหลด */
async function cropImageToBlob(
  image: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  zoom: number,
) {
  const canvas = document.createElement("canvas");
  drawCropToCanvas(canvas, image, offsetX, offsetY, zoom);

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [zoom, setZoom] = useState(1);
  const previewUrl = url || getDefaultImageUrl(kind);
  const usesProfileShape = kind === "profile" || kind === "roomProfile";
  const cropImageStyle = {
    "--crop-offset-x": `${offsetX * 0.08}%`,
    "--crop-offset-y": `${offsetY * 0.08}%`,
    "--crop-zoom": zoom,
  } as CSSProperties;

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageReady) return;
    drawCropToCanvas(canvas, image, offsetX, offsetY, zoom);
  }, [cropState, imageReady, offsetX, offsetY, zoom]);

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
    setImageReady(false);
    setCropState({
      fileName: file.name,
      imageUrl: URL.createObjectURL(file),
    });
  }

  /** ปิด modal และคืน object URL ให้ browser เพื่อไม่ให้ค้างในหน่วยความจำ */
  function closeCropper() {
    if (cropState) URL.revokeObjectURL(cropState.imageUrl);
    setCropState(null);
    pointersRef.current.clear();
    dragStateRef.current = null;
    pinchStateRef.current = null;
  }

  /** เริ่มติดตามนิ้วหรือเมาส์เพื่อเลื่อนภาพ และเริ่ม pinch เมื่อมีสองนิ้ว */
  function handleCropPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const pointers = [...pointersRef.current.values()];
    if (pointers.length === 2) {
      pinchStateRef.current = {
        distance: Math.hypot(
          pointers[1].x - pointers[0].x,
          pointers[1].y - pointers[0].y,
        ),
        zoom,
      };
      dragStateRef.current = null;
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  /** เลื่อนภาพตาม pointer หรือซูมด้วยระยะห่างของสองนิ้ว */
  function handleCropPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const pointers = [...pointersRef.current.values()];
    const pinchState = pinchStateRef.current;
    if (pointers.length === 2 && pinchState?.distance) {
      const distance = Math.hypot(
        pointers[1].x - pointers[0].x,
        pointers[1].y - pointers[0].y,
      );
      setZoom(
        Math.min(
          2,
          Math.max(1, pinchState.zoom * (distance / pinchState.distance)),
        ),
      );
      return;
    }

    const dragState = dragStateRef.current;
    const frame = cropFrameRef.current;
    if (!dragState || !frame || dragState.pointerId !== event.pointerId) return;
    const bounds = frame.getBoundingClientRect();
    setOffsetX(
      getDraggedCropOffset({
        delta: event.clientX - dragState.startX,
        frameSize: bounds.width,
        startOffset: dragState.startOffsetX,
      }),
    );
    setOffsetY(
      getDraggedCropOffset({
        delta: event.clientY - dragState.startY,
        frameSize: bounds.height,
        startOffset: dragState.startOffsetY,
      }),
    );
  }

  /** จบ gesture ปัจจุบันและเตรียม pointer ที่เหลือให้ลากต่อได้ */
  function handleCropPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    pinchStateRef.current = null;
    const remainingPointer = [...pointersRef.current.entries()][0];
    dragStateRef.current = remainingPointer
      ? {
          pointerId: remainingPointer[0],
          startOffsetX: offsetX,
          startOffsetY: offsetY,
          startX: remainingPointer[1].x,
          startY: remainingPointer[1].y,
        }
      : null;
  }

  /** ซูมด้วยล้อเมาส์โดยคงช่วงเดียวกับ slider */
  function handleCropWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoom((current) =>
      Math.min(2, Math.max(1, current - event.deltaY * 0.0015)),
    );
  }

  /** รองรับปุ่มลูกศรเมื่อผู้ใช้จัดภาพด้วยคีย์บอร์ด */
  function handleCropKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const movement = event.shiftKey ? 10 : 4;
    if (event.key === "ArrowLeft")
      setOffsetX((value) => Math.max(-100, value - movement));
    else if (event.key === "ArrowRight")
      setOffsetX((value) => Math.min(100, value + movement));
    else if (event.key === "ArrowUp")
      setOffsetY((value) => Math.max(-100, value - movement));
    else if (event.key === "ArrowDown")
      setOffsetY((value) => Math.min(100, value + movement));
    else return;
    event.preventDefault();
  }

  /** คืนภาพไปยังตำแหน่งและขนาดเริ่มต้น */
  function resetCropPosition() {
    setOffsetX(0);
    setOffsetY(0);
    setZoom(1);
  }

  /** ครอปรูป แล้วอัปโหลดไป Supabase Storage bucket ที่ตรงกับชนิดรูป */
  async function uploadCroppedImage() {
    const image = imageRef.current;
    if (!image || !cropState) return;

    setIsUploading(true);
    setError(null);
    setStatus({ title: "กำลังเตรียมรูป…" });

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

      setStatus({ title: "กำลังอัปโหลดรูป…" });
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
      setStatus({
        title: "อัปโหลดรูปแล้ว",
        detail: "กรุณากดบันทึกเพื่อใช้รูปนี้",
      });
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
            <ImagePlus aria-hidden size={16} />
            {label}
            <input
              accept="image/png,image/jpeg,image/webp"
              id={fieldId}
              onChange={handleFileChange}
              type="file"
            />
          </label>
          {url ? (
            <button
              className={styles.deleteButton}
              onClick={() => setIsConfirmOpen(true)}
              type="button"
            >
              <Trash2 size={16} aria-hidden />
              ลบรูป
            </button>
          ) : null}
        </div>
      </div>
      {helperText ? <p className={styles.hint}>{helperText}</p> : null}
      {status ? (
        <div className={styles.status} role="status">
          <strong>{status.title}</strong>
          {status.detail ? <span>{status.detail}</span> : null}
        </div>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmationDialog
        confirmLabel="ใช่, ลบรูป"
        description="คุณแน่ใจหรือไม่ที่จะลบรูปนี้และกลับไปใช้รูปเริ่มต้น?"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          setIsConfirmOpen(false);
          setStatus({ title: "กำลังเอารูปออก…" });
          if (removeOldOnUpload) await removeStoredImage(url);
          setUrl("");
          setStatus({
            title: "เลือกลบรูปแล้ว",
            detail: removeOldOnUpload
              ? "กรุณากดบันทึกเพื่อยืนยัน"
              : "กรุณากดบันทึกเพื่อยืนยัน",
          });
        }}
        open={isConfirmOpen}
        title="นำรูปออก?"
        variant="danger"
      />

      <Modal
        description="ปรับขนาดและตำแหน่งให้ส่วนสำคัญของภาพอยู่ในกรอบ"
        isOpen={Boolean(cropState)}
        onClose={() => !isUploading && closeCropper()}
        size="lg"
        title="ครอปรูปก่อนใช้"
      >
        {cropState ? (
          <div className={styles.cropWorkspace}>
            <div className={styles.cropMain}>
              <div
                aria-label="ลากภาพเพื่อจัดตำแหน่ง"
                className={styles.cropFrame}
                onKeyDown={handleCropKeyDown}
                onPointerCancel={handleCropPointerEnd}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerEnd}
                onWheel={handleCropWheel}
                ref={cropFrameRef}
                role="application"
                style={cropImageStyle}
                tabIndex={0}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  aria-hidden
                  className={styles.cropBackdrop}
                  src={cropState.imageUrl}
                />
                <div className={styles.cropShade} aria-hidden />
                <div
                  className={`${styles.cropWindow} ${usesProfileShape ? styles.profileShape : ""}`}
                >
                  <canvas
                    aria-label={`ตัวอย่างรูป ${cropState.fileName}`}
                    className={styles.cropCanvas}
                    ref={canvasRef}
                  />
                  <span aria-hidden className={styles.cropGrid} />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className={styles.cropSource}
                  onLoad={() => setImageReady(true)}
                  ref={imageRef}
                  src={cropState.imageUrl}
                />
                <span aria-hidden className={styles.dragBadge}>
                  <Move size={15} /> ลากเพื่อจัดตำแหน่ง
                </span>
              </div>
              <p className={styles.cropHint}>
                ลากภาพด้วยเมาส์หรือนิ้ว ใช้สองนิ้วหรือล้อเมาส์เพื่อซูม
              </p>
            </div>
            <aside className={styles.cropControls}>
              <div className={styles.cropControlIntro}>
                <span className={styles.cropControlIcon} aria-hidden>
                  <Move size={18} />
                </span>
                <div>
                  <strong>จัดภาพให้อยู่ในกรอบ</strong>
                  <p>ส่วนที่เห็นในกรอบคือรูปหลังบันทึก</p>
                </div>
              </div>
              <label className={styles.slider}>
                <span>
                  <span>
                    <ZoomIn aria-hidden size={16} /> ซูม
                  </span>
                  <output>{Math.round(zoom * 100)}%</output>
                </span>
                <input
                  max="2"
                  min="1"
                  onChange={(event) => setZoom(Number(event.target.value))}
                  step="0.05"
                  type="range"
                  value={zoom}
                />
              </label>
              <Button onClick={resetCropPosition} type="button">
                <RotateCcw aria-hidden size={15} /> รีเซ็ตตำแหน่ง
              </Button>
              <div className={styles.modalActions}>
                <Button
                  disabled={isUploading}
                  onClick={closeCropper}
                  type="button"
                >
                  <X aria-hidden size={16} /> ยกเลิก
                </Button>
                <Button
                  onClick={uploadCroppedImage}
                  pending={isUploading}
                  pendingText="กำลังอัปโหลด…"
                  type="button"
                  variant="primary"
                >
                  <Check aria-hidden size={16} /> ใช้รูปนี้
                </Button>
              </div>
            </aside>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
