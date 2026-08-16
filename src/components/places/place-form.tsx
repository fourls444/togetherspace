"use client";

import { useActionState, useEffect } from "react";

import { ActionSuccessToast } from "@/components/ui/action-success-toast";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FieldErrors } from "@/components/ui/field-errors";
import { createPlace, type PlaceActionState } from "@/features/places/actions";
import type { PlacePosition } from "@/components/places/place-map";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/components/places/place-map.module.css";

const initialState: PlaceActionState = {};

type PlaceFormProps = {
  draftAddress?: string | null;
  /** เรียกเมื่อบันทึกสำเร็จ — ให้ workspace เคลียร์หมุดร่าง */
  onSaveSuccess: () => void;
  /** เรียกเมื่อกดยกเลิก — ให้ workspace เคลียร์หมุดร่าง */
  onCancelPin: () => void;
  roomCode: string;
  roomId: string;
  selectedPosition: PlacePosition | null;
};

/** ฟอร์มเพิ่มสถานที่ ใช้พิกัดจากหมุดที่เลือกบนแผนที่ */
export function PlaceForm({
  draftAddress,
  onSaveSuccess,
  onCancelPin,
  roomCode,
  roomId,
  selectedPosition,
}: PlaceFormProps) {
  const [state, formAction, isPending] = useActionState(
    createPlace,
    initialState,
  );

  /** เคลียร์หมุดร่างทันทีที่บันทึกสำเร็จ */
  useEffect(() => {
    if (state.success) {
      onSaveSuccess();
    }
  }, [state.success, onSaveSuccess]);

  return (
    <form action={formAction} className={styles.placeForm}>
      <input name="roomCode" type="hidden" value={roomCode} />
      <input name="roomId" type="hidden" value={roomId} />
      <input
        name="latitude"
        type="hidden"
        value={selectedPosition ? String(selectedPosition.latitude) : ""}
      />
      <input
        name="longitude"
        type="hidden"
        value={selectedPosition ? String(selectedPosition.longitude) : ""}
      />

      <div className={styles.selectedPinBox}>
        <span>ตำแหน่งที่เลือก</span>
        {selectedPosition ? (
          <strong
            style={{
              display: "block",
              marginTop: "0.2rem",
              fontSize: "0.95rem",
            }}
          >
            {draftAddress ? draftAddress : "กำลังดึงที่อยู่..."}
          </strong>
        ) : (
          <strong>ยังไม่ได้เลือกตำแหน่ง</strong>
        )}
        <FieldErrors
          id="place-latitude-errors"
          messages={state.fieldErrors?.latitude}
        />
        <FieldErrors
          id="place-longitude-errors"
          messages={state.fieldErrors?.longitude}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="placeName">
          ชื่อสถานที่
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.name ? "place-name-errors" : undefined
          }
          className={formStyles.control}
          id="placeName"
          maxLength={120}
          name="name"
          placeholder="เช่น ร้านโปรดของเรา"
          defaultValue={
            draftAddress && draftAddress !== "กำลังดึงชื่อสถานที่..."
              ? draftAddress.split(",")[0]
              : ""
          }
          required
        />
        <FieldErrors
          id="place-name-errors"
          messages={state.fieldErrors?.name}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="placeDate">
          วันที่เกี่ยวข้อง (ไม่บังคับ)
        </label>
        <DateField
          aria-describedby={
            state.fieldErrors?.placeDate ? "place-date-errors" : undefined
          }
          id="placeDate"
          name="placeDate"
        />
        <FieldErrors
          id="place-date-errors"
          messages={state.fieldErrors?.placeDate}
        />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="placeDescription">
          รายละเอียด (ไม่บังคับ)
        </label>
        <textarea
          aria-describedby={
            state.fieldErrors?.description
              ? "place-description-errors"
              : undefined
          }
          className={formStyles.control}
          id="placeDescription"
          maxLength={1000}
          name="description"
          placeholder="บันทึกว่าที่นี่สำคัญกับห้องนี้ยังไง"
          rows={3}
        />
        <FieldErrors
          id="place-description-errors"
          messages={state.fieldErrors?.description}
        />
      </div>

      {state.error ? (
        <p className={formStyles.serviceError} role="alert">
          {state.error}
        </p>
      ) : null}

      <div className={styles.placeEditorActions}>
        {/* ปุ่มยกเลิก — แสดงเมื่อมีหมุดร่าง */}
        {selectedPosition ? (
          <button
            className={styles.cancelPinButton}
            disabled={isPending}
            onClick={onCancelPin}
            type="button"
          >
            ยกเลิก
          </button>
        ) : null}
        <Button
          disabled={!selectedPosition}
          pending={isPending}
          pendingText="กำลังบันทึก…"
          variant="primary"
        >
          เพิ่มสถานที่
        </Button>
      </div>
      <ActionSuccessToast
        message="เพิ่มสถานที่แล้ว"
        signal={state}
        success={state.success}
      />
    </form>
  );
}
