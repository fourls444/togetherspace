"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, MapPinPlus, Map, Pencil, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Toast } from "@/components/ui/toast";
import { deletePlace, updatePlace } from "@/features/places/actions";
import type { PlaceMapItem, PlacePosition } from "@/components/places/place-map";
import { PlaceTypeIcon } from "@/components/places/place-type-icon";
import { getGoogleMapsUrl } from "@/lib/places/place-icon";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/components/places/place-map.module.css";

type PlaceListProps = {
  /** พิกัดที่กำลังย้ายสำหรับรายการที่แก้ไขอยู่ */
  editingPosition?: PlacePosition | null;
  /** รายการสถานที่ทั้งหมดในห้อง */
  places: PlaceMapItem[];
  /** รหัสห้องสำหรับ revalidate path */
  roomCode: string;
  /** UUID ของห้อง */
  roomId: string;
  /** id ของสถานที่ที่เลือกอยู่ (ไฮไลต์) */
  selectedPlaceId?: string | null;
  /** เรียกเมื่อคลิกรายการ (ทางเลือก) */
  onSelectPlace?: (place: PlaceMapItem) => void;
  /** เรียกเมื่อกดปุ่ม "ย้ายหมุด" (ถ้าไม่มี จะซ่อนปุ่มย้ายหมุด) */
  onStartMovePin?: (placeId: string) => void;
  /** เปิดช่องค้นหาจากชื่อสถานที่ */
  searchable?: boolean;
};

function formatPlaceDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

type PlaceItemEditorProps = {
  editingPosition?: PlacePosition | null;
  isMovingPin: boolean;
  isPending: boolean;
  onStartMovePin?: () => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  place: PlaceMapItem;
  roomCode: string;
  roomId: string;
};

/** Inline editor สำหรับแก้ไขสถานที่เดี่ยวๆ */
function PlaceItemEditor({
  editingPosition,
  isMovingPin,
  isPending,
  onStartMovePin,
  onUpdate,
  place,
  roomCode,
  roomId,
}: PlaceItemEditorProps) {
  const activeLatitude = isMovingPin && editingPosition ? editingPosition.latitude : place.latitude;
  const activeLongitude = isMovingPin && editingPosition ? editingPosition.longitude : place.longitude;

  return (
    <div className={styles.placeEditor}>
      <p className={styles.placeEditorTitle}>แก้ไขสถานที่</p>
      <form className={styles.placeEditorForm} onSubmit={onUpdate}>
        <input name="placeId" type="hidden" value={place.id} />
        <input name="roomId" type="hidden" value={roomId} />
        <input name="roomCode" type="hidden" value={roomCode} />
        <input name="latitude" type="hidden" value={String(activeLatitude)} />
        <input name="longitude" type="hidden" value={String(activeLongitude)} />

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor={`edit-name-${place.id}`}>
            ชื่อสถานที่
          </label>
          <input
            className={formStyles.control}
            defaultValue={place.name}
            id={`edit-name-${place.id}`}
            maxLength={120}
            name="name"
            required
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor={`edit-date-${place.id}`}>
            วันที่เกี่ยวข้อง (ไม่บังคับ)
          </label>
          <input
            className={formStyles.control}
            defaultValue={place.placeDate ?? ""}
            id={`edit-date-${place.id}`}
            name="placeDate"
            type="date"
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor={`edit-desc-${place.id}`}>
            รายละเอียด (ไม่บังคับ)
          </label>
          <textarea
            className={formStyles.control}
            defaultValue={place.description ?? ""}
            id={`edit-desc-${place.id}`}
            maxLength={1000}
            name="description"
            rows={2}
          />
        </div>

        <div className={styles.placeEditorActions} style={{ marginTop: "0.5rem" }}>
          {onStartMovePin && (
            <button
              className={`${styles.movePinButton} ${isMovingPin ? styles.movePinActive : ""}`}
              disabled={isPending}
              onClick={onStartMovePin}
              type="button"
            >
              {isMovingPin ? (
                <><MapPin size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> กำลังเลือกตำแหน่ง…</>
              ) : (
                <><MapPinPlus size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> ย้ายหมุด</>
              )}
            </button>
          )}
          <Button pending={isPending} type="submit" variant="primary">
            บันทึก
          </Button>
        </div>
        
        {/* ปุ่มลิงก์ไปหน้าแผนที่ */}
        <Link 
          href={`/rooms/${roomCode}/map?placeId=${place.id}`}
          className={styles.movePinButton}
          style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: "0.25rem" }}
        >
          <Map size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> ดูตำแหน่งบนแผนที่
        </Link>
      </form>
    </div>
  );
}

/** รายการสถานที่ทั้งหมดในห้องพร้อม inline editor */
export function PlaceList({
  editingPosition,
  onSelectPlace,
  onStartMovePin,
  places,
  roomCode,
  roomId,
  searchable = false,
  selectedPlaceId,
}: PlaceListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [movingPinId, setMovingPinId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const filteredPlaces = searchQuery.trim()
    ? places.filter((place) =>
        place.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : places;

  function handleSelectPlace(place: PlaceMapItem) {
    if (onSelectPlace) {
      onSelectPlace(place);
    }
    setExpandedId((current) => (current === place.id ? null : place.id));
    if (movingPinId !== place.id) {
      setMovingPinId(null);
    }
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMovingPinId(null);
    startTransition(async () => {
      const result = await updatePlace(formData);
      setToast({
        message: result.error ?? "บันทึกสถานที่แล้ว",
        tone: result.error ? "error" : "success",
      });
    });
  }

  function handleDelete() {
    if (!confirmDeleteId) return;
    const formData = new FormData();
    formData.set("placeId", confirmDeleteId);
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    startTransition(async () => {
      const result = await deletePlace(formData);
      setConfirmDeleteId(null);
      setExpandedId(null);
      setMovingPinId(null);
      setToast({
        message: result.error ?? "ลบสถานที่แล้ว",
        tone: result.error ? "error" : "success",
      });
    });
  }

  function handleStartMovePin(placeId: string) {
    if (!onStartMovePin) return;
    const isAlreadyMoving = movingPinId === placeId;
    setMovingPinId(isAlreadyMoving ? null : placeId);
    if (!isAlreadyMoving) {
      onStartMovePin(placeId);
    }
  }

  const placeToDelete = places.find((p) => p.id === confirmDeleteId);

  if (!places.length) {
    return (
      <div className={styles.emptyStateFull}>
        <span aria-hidden="true" className={styles.emptyStateIcon}>
          <MapPin size={48} strokeWidth={1.5} />
        </span>
        <p className={styles.emptyStateText}>
          ยังไม่มีสถานที่ในห้องนี้<br />
          สามารถเพิ่มสถานที่ใหม่ได้ในหน้าแผนที่
        </p>
      </div>
    );
  }

  return (
    <>
      {searchable ? (
        <div className={styles.placeListSearch}>
          <Search aria-hidden="true" size={18} strokeWidth={2.2} />
          <input
            aria-label="ค้นหาชื่อสถานที่"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ค้นหาชื่อสถานที่..."
            type="search"
            value={searchQuery}
          />
        </div>
      ) : null}

      {searchable && !filteredPlaces.length ? (
        <div className={styles.emptyStateFull}>
          <span aria-hidden="true" className={styles.emptyStateIcon}>
            <Search size={44} strokeWidth={1.6} />
          </span>
          <p className={styles.emptyStateText}>
            ไม่พบสถานที่ชื่อนี้<br />
            ลองพิมพ์คำค้นหาให้สั้นลงอีกนิด
          </p>
        </div>
      ) : null}

      <ul className={styles.placeList}>
        {filteredPlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const isExpanded = place.id === expandedId;
          const isMovingPin = place.id === movingPinId;

          return (
            <li
              className={`${styles.placeItem} ${isSelected ? styles.placeItemSelected : ""}`}
              key={place.id}
            >
              <div className={styles.placeItemHeader}>
                <span className={styles.placeItemTypeIcon}>
                  <PlaceTypeIcon
                    description={place.description}
                    name={place.name}
                  />
                </span>
                <button
                  aria-expanded={isExpanded}
                  className={styles.placeItemButton}
                  onClick={() => handleSelectPlace(place)}
                  type="button"
                >
                  <div className={styles.placeItemContent}>
                    <h3 className={styles.placeItemName}>{place.name}</h3>
                    {place.description ? (
                      <p className={styles.placeItemDesc}>{place.description}</p>
                    ) : null}
                    {place.placeDate && (
                      <span className={styles.placeMeta}>
                        {formatPlaceDate(place.placeDate)}
                      </span>
                    )}
                  </div>
                </button>
                
                <div className={styles.placeItemQuickActions}>
                  <button 
                    className={styles.quickActionButton} 
                    onClick={() => {
                      setExpandedId(isExpanded ? null : place.id);
                      if (!isExpanded && onSelectPlace) onSelectPlace(place);
                    }}
                    aria-label={`แก้ไข ${place.name}`}
                    title="แก้ไข"
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <a
                    aria-label={`เปิด ${place.name} บน Google Maps`}
                    className={styles.quickActionButton}
                    href={getGoogleMapsUrl(place.latitude, place.longitude)}
                    rel="noreferrer"
                    target="_blank"
                    title="เปิดบน Google Maps"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button 
                    className={`${styles.quickActionButton} ${styles.quickActionDelete}`} 
                    onClick={() => setConfirmDeleteId(place.id)}
                    aria-label={`ลบ ${place.name}`}
                    title="ลบ"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <PlaceItemEditor
                  editingPosition={editingPosition}
                  isMovingPin={isMovingPin}
                  isPending={isPending}
                  onStartMovePin={onStartMovePin ? () => handleStartMovePin(place.id) : undefined}
                  onUpdate={handleUpdate}
                  place={place}
                  roomCode={roomCode}
                  roomId={roomId}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <ConfirmationDialog
        confirmLabel="ลบสถานที่"
        description={`"${placeToDelete?.name ?? ""}" จะถูกลบออกจากแผนที่และไม่สามารถกู้คืนได้`}
        isPending={isPending}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        open={confirmDeleteId !== null}
        title="ลบสถานที่นี้?"
        variant="danger"
      />

      <Toast
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        tone={toast?.tone}
      />
    </>
  );
}
