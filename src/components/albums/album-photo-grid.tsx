"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState, useTransition } from "react";

import { Toast } from "@/components/ui/toast";
import {
  saveAlbumPhotoOrder,
} from "@/features/albums/actions";
import type { RoomRole } from "@/lib/types/database";

import styles from "./album.module.css";
import { AlbumPhotoDialog } from "./album-photo-dialog";

export type AlbumPhotoView = {
  caption: string | null;
  created_at: string;
  id: string;
  image_url: string;
  sort_order: number;
  storage_path: string;
  taken_at: string;
  uploaded_by: string;
};

type AlbumPhotoGridProps = {
  currentUserId: string;
  photos: AlbumPhotoView[];
  roomCode: string;
  roomId: string;
  roomRole: RoomRole;
};

type SortableAlbumPhotoProps = {
  canDrag: boolean;
  onOpen: () => void;
  photo: AlbumPhotoView;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

/** แสดงวันที่ภาษาไทยจาก date key ของฐานข้อมูล */
function formatAlbumDate(dateKey: string) {
  return DATE_FORMATTER.format(new Date(`${dateKey}T00:00:00.000Z`));
}

/** ตรวจว่าผู้ใช้คนนี้ลบรูปนี้ได้หรือไม่ */
function canManagePhoto({
  currentUserId,
  photo,
  roomRole,
}: {
  currentUserId: string;
  photo: AlbumPhotoView;
  roomRole: RoomRole;
}) {
  return roomRole === "owner" || photo.uploaded_by === currentUserId;
}

/** จัดกลุ่มรูปตามวันที่ เพื่อให้ลากเรียงได้โดยไม่ชนกับการเรียงหลักตามวัน */
function groupPhotosByDate(photos: AlbumPhotoView[]) {
  const groups = new Map<string, AlbumPhotoView[]>();

  photos.forEach((photo) => {
    const group = groups.get(photo.taken_at) ?? [];
    group.push(photo);
    groups.set(photo.taken_at, group);
  });

  return Array.from(groups.entries()).map(([dateKey, groupPhotos]) => ({
    dateKey,
    photos: groupPhotos,
  }));
}

/** คืน true เมื่อผู้ใช้ลากรูปทั้งกลุ่มของวันนั้นได้ */
function canDragDateGroup({
  currentUserId,
  photos,
  roomRole,
}: {
  currentUserId: string;
  photos: AlbumPhotoView[];
  roomRole: RoomRole;
}) {
  if (roomRole === "owner") return true;
  return photos.every((photo) => photo.uploaded_by === currentUserId);
}

/** แสดงการ์ดรูปที่ลากวางได้ด้วย dnd-kit */
function SortableAlbumPhoto({
  canDrag,
  onOpen,
  photo,
}: SortableAlbumPhotoProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    disabled: !canDrag,
    id: photo.id,
  });
  const style = {
    opacity: isDragging ? 0.68 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={`${styles.photoCard} ${canDrag ? styles.photoCardDraggable : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label="ลากเพื่อจัดลำดับรูป"
        className={styles.dragHandle}
        disabled={!canDrag}
        type="button"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <button className={styles.photoLink} onClick={onOpen} type="button">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={photo.caption ?? "รูปในอัลบั้ม"} src={photo.image_url} />
      </button>
      <div className={styles.photoMeta}>
        <p>{formatAlbumDate(photo.taken_at)}</p>
        {photo.caption ? <strong>{photo.caption}</strong> : null}
      </div>
    </article>
  );
}

/** แสดงรูปในอัลบั้มแบบจัดกลุ่มตามวันที่ พร้อม drag and drop เพื่อเรียงรูป */
export function AlbumPhotoGrid({
  currentUserId,
  photos,
  roomCode,
  roomId,
  roomRole,
}: AlbumPhotoGridProps) {
  const [orderedPhotos, setOrderedPhotos] = useState(photos);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [, startSavingTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const groups = useMemo(() => groupPhotosByDate(orderedPhotos), [orderedPhotos]);
  const selectedPhotoIndex = orderedPhotos.findIndex(
    (photo) => photo.id === selectedPhotoId,
  );
  const selectedPhoto = orderedPhotos[selectedPhotoIndex] ?? null;

  /** เลื่อนไปยังรูปก่อนหน้าหรือถัดไปแบบวนกลับเมื่อถึงปลายรายการ */
  function moveSelectedPhoto(direction: "next" | "previous") {
    if (!orderedPhotos.length || selectedPhotoIndex < 0) return;
    const offset = direction === "next" ? 1 : -1;
    const nextIndex =
      (selectedPhotoIndex + offset + orderedPhotos.length) % orderedPhotos.length;
    setSelectedPhotoId(orderedPhotos[nextIndex].id);
  }

  /** บันทึกลำดับรูปใหม่หลังปล่อยรูปที่ลาก */
  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;

    const activePhoto = orderedPhotos.find((photo) => photo.id === activeId);
    const overPhoto = orderedPhotos.find((photo) => photo.id === overId);
    if (!activePhoto || !overPhoto || activePhoto.taken_at !== overPhoto.taken_at) {
      return;
    }

    const dateGroup = orderedPhotos.filter(
      (photo) => photo.taken_at === activePhoto.taken_at,
    );
    if (
      !canDragDateGroup({
        currentUserId,
        photos: dateGroup,
        roomRole,
      })
    ) {
      return;
    }

    const oldIndex = dateGroup.findIndex((photo) => photo.id === activeId);
    const newIndex = dateGroup.findIndex((photo) => photo.id === overId);
    const reorderedGroup = arrayMove(dateGroup, oldIndex, newIndex);
    const nextGroupQueue = [...reorderedGroup];
    const nextPhotos = orderedPhotos.map((photo) =>
      photo.taken_at === activePhoto.taken_at
        ? (nextGroupQueue.shift() ?? photo)
        : photo,
    );

    const previousPhotos = orderedPhotos;
    setOrderedPhotos(nextPhotos);
    setSavingDate(activePhoto.taken_at);

    const formData = new FormData();
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    formData.set("dateKey", activePhoto.taken_at);
    formData.set(
      "photoIdsJson",
      JSON.stringify(reorderedGroup.map((photo) => photo.id)),
    );

    startSavingTransition(async () => {
      const result = await saveAlbumPhotoOrder(formData);
      if (result.error) {
        setOrderedPhotos(previousPhotos);
        setToast({ message: result.error, tone: "error" });
      } else {
        setToast({ message: "บันทึกลำดับรูปแล้ว", tone: "success" });
      }
      setSavingDate(null);
    });
  }

  if (!photos.length) {
    return (
      <section className={styles.emptyCard}>
        <h2 className={styles.sectionTitle}>ยังไม่มีรูปในอัลบั้ม</h2>
        <p className={styles.muted}>
          กดอัปโหลดภาพเพื่อเพิ่มรูปแรกของห้องนี้ได้เลย
        </p>
      </section>
    );
  }

  return (
    <section className={styles.gallerySection}>
      <div className={styles.galleryHead}>
        <div>
          <p className={styles.kicker}>รูปทั้งหมด</p>
          <h2 className={styles.sectionTitle}>{photos.length} รูป</h2>
        </div>
        <p className={styles.galleryHint}>
          ลากรูปเพื่อจัดลำดับใหม่ภายในวันเดียวกัน
        </p>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className={styles.dateGroups}>
          {groups.map((group) => {
            const canDragGroup = canDragDateGroup({
              currentUserId,
              photos: group.photos,
              roomRole,
            });

            return (
              <section className={styles.dateGroup} key={group.dateKey}>
                <div className={styles.dateGroupHead}>
                  <h3>{formatAlbumDate(group.dateKey)}</h3>
                  {savingDate === group.dateKey ? <span>กำลังบันทึกลำดับ...</span> : null}
                </div>
                <SortableContext
                  items={group.photos.map((photo) => photo.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={styles.grid}>
                    {group.photos.map((photo) => (
                      <SortableAlbumPhoto
                        canDrag={canDragGroup}
                        key={photo.id}
                        onOpen={() => setSelectedPhotoId(photo.id)}
                        photo={photo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </section>
            );
          })}
        </div>
      </DndContext>
      <AlbumPhotoDialog
        canManage={
          selectedPhoto
            ? canManagePhoto({ currentUserId, photo: selectedPhoto, roomRole })
            : false
        }
        key={selectedPhoto?.id ?? "closed-photo-dialog"}
        onClose={() => setSelectedPhotoId(null)}
        onDeleted={(photoId) =>
          setOrderedPhotos((current) =>
            current.filter((photo) => photo.id !== photoId),
          )
        }
        onMove={moveSelectedPhoto}
        onUpdated={(updatedPhoto) =>
          setOrderedPhotos((current) =>
            current
              .map((photo) =>
                photo.id === updatedPhoto.id ? updatedPhoto : photo,
              )
              .sort(
                (left, right) =>
                  left.taken_at.localeCompare(right.taken_at) ||
                  left.sort_order - right.sort_order ||
                  left.created_at.localeCompare(right.created_at),
              ),
          )
        }
        open={Boolean(selectedPhoto)}
        photo={selectedPhoto}
        photoPosition={
          selectedPhoto ? `${selectedPhotoIndex + 1} / ${orderedPhotos.length}` : ""
        }
        roomCode={roomCode}
        roomId={roomId}
      />
      <Toast
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        tone={toast?.tone}
      />
    </section>
  );
}
