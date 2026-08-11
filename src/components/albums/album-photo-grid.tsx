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

import { Button } from "@/components/ui/button";
import {
  deleteAlbumPhoto,
  saveAlbumPhotoOrder,
} from "@/features/albums/actions";
import type { RoomRole } from "@/lib/types/database";

import styles from "./album.module.css";

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
  currentUserId: string;
  photo: AlbumPhotoView;
  roomCode: string;
  roomId: string;
  roomRole: RoomRole;
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
  currentUserId,
  photo,
  roomCode,
  roomId,
  roomRole,
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
      <a className={styles.photoLink} href={`#photo-${photo.id}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={photo.caption ?? "รูปในอัลบั้ม"} src={photo.image_url} />
      </a>
      <div className={styles.photoMeta}>
        <p>{formatAlbumDate(photo.taken_at)}</p>
        {photo.caption ? <strong>{photo.caption}</strong> : null}
      </div>

      <div className={styles.modal} id={`photo-${photo.id}`}>
        <a aria-label="ปิดรูป" className={styles.modalBackdrop} href="#album" />
        <div className={styles.modalPanel}>
          <a className={styles.closeLink} href="#album">
            ปิด
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={photo.caption ?? "รูปในอัลบั้ม"} src={photo.image_url} />
          <div className={styles.modalCaption}>
            <p>{formatAlbumDate(photo.taken_at)}</p>
            {photo.caption ? <h3>{photo.caption}</h3> : null}
          </div>
          {canManagePhoto({ currentUserId, photo, roomRole }) ? (
            <form action={deleteAlbumPhoto} className={styles.deleteForm}>
              <input name="roomId" type="hidden" value={roomId} />
              <input name="roomCode" type="hidden" value={roomCode} />
              <input name="photoId" type="hidden" value={photo.id} />
              <input name="storagePath" type="hidden" value={photo.storage_path} />
              <Button type="submit" variant="danger">
                ลบรูปนี้
              </Button>
            </form>
          ) : null}
        </div>
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
  const [savingDate, setSavingDate] = useState<string | null>(null);
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

    startSavingTransition(() => {
      void saveAlbumPhotoOrder(formData).finally(() => setSavingDate(null));
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
                        currentUserId={currentUserId}
                        key={photo.id}
                        photo={photo}
                        roomCode={roomCode}
                        roomId={roomId}
                        roomRole={roomRole}
                      />
                    ))}
                  </div>
                </SortableContext>
              </section>
            );
          })}
        </div>
      </DndContext>
    </section>
  );
}
