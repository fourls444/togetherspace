"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import { createPlace, type PlaceActionState } from "@/features/places/actions";
import type { PlacePosition } from "@/components/places/place-map";
import formStyles from "@/components/ui/form.module.css";
import styles from "@/components/places/place-map.module.css";

const initialState: PlaceActionState = {};

type PlaceFormProps = {
  roomCode: string;
  roomId: string;
  selectedPosition: PlacePosition | null;
};

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

/** ฟอร์มเพิ่มสถานที่ ใช้พิกัดจากหมุดที่เลือกบนแผนที่ */
export function PlaceForm({
  roomCode,
  roomId,
  selectedPosition,
}: PlaceFormProps) {
  const [state, formAction, isPending] = useActionState(
    createPlace,
    initialState,
  );

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
        <span>หมุดที่จะบันทึก</span>
        {selectedPosition ? (
          <strong>
            {formatCoordinate(selectedPosition.latitude)},{" "}
            {formatCoordinate(selectedPosition.longitude)}
          </strong>
        ) : (
          <strong>ยังไม่ได้เลือกตำแหน่ง</strong>
        )}
        <p>คลิกบนแผนที่เพื่อเลือกตำแหน่งใหม่ได้ตลอด</p>
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
          required
        />
        <FieldErrors id="place-name-errors" messages={state.fieldErrors?.name} />
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="placeDate">
          วันที่เกี่ยวข้อง (ไม่บังคับ)
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.placeDate ? "place-date-errors" : undefined
          }
          className={formStyles.control}
          id="placeDate"
          name="placeDate"
          type="date"
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

      {state.success ? (
        <p className={formStyles.serviceSuccess} role="status">
          เพิ่มสถานที่แล้ว
        </p>
      ) : null}

      <Button
        disabled={!selectedPosition}
        pending={isPending}
        pendingText="กำลังบันทึก…"
        variant="primary"
      >
        เพิ่มสถานที่
      </Button>
    </form>
  );
}
