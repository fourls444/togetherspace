"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";

import {
  deleteFamilyTreePerson,
  moveFamilyTreePerson,
  upsertFamilyTreePerson,
  type FamilyTreeActionState,
} from "@/features/family-tree/actions";
import { Button } from "@/components/ui/button";
import { FieldErrors } from "@/components/ui/field-errors";
import { Toast } from "@/components/ui/toast";
import type {
  FamilyTreeRelationshipType,
  FamilyTreeRole,
} from "@/lib/types/database";
import styles from "./family-tree.module.css";

export type FamilyTreePersonView = {
  avatarUrl: string;
  displayName: string;
  id: string;
  positionX: number;
  positionY: number;
  role: FamilyTreeRole;
  roomMemberUserId: string | null;
};

export type FamilyTreeRelationshipView = {
  fromPersonId: string;
  id: string;
  relationshipType: FamilyTreeRelationshipType;
  toPersonId: string;
};

export type FamilyTreeMemberOption = {
  avatarUrl: string;
  displayName: string;
  userId: string;
  username: string;
};

type FamilyTreeClientProps = {
  initialPeople: FamilyTreePersonView[];
  initialRelationships: FamilyTreeRelationshipView[];
  members: FamilyTreeMemberOption[];
  roomCode: string;
  roomId: string;
};

const PERSON_CARD_WIDTH = 176;
const PERSON_CARD_HEIGHT = 92;
const initialActionState: FamilyTreeActionState = {};

const ROLE_LABEL: Record<FamilyTreeRole, string> = {
  child: "ลูก",
  parent: "พ่อ/แม่",
  sibling: "พี่น้อง",
};

/** จัดขอบเขตตำแหน่ง card ไม่ให้ลากหลุด canvas ไกลเกินไป */
function clampPosition(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

/** แปลงคนในผังเป็น Map เพื่อหา card ปลายเส้นได้เร็วขึ้น */
function createPeopleMap(people: FamilyTreePersonView[]) {
  return new Map(people.map((person) => [person.id, person]));
}

/** วาดและแก้ไขผังครอบครัวแบบ hybrid สำหรับห้อง family */
export function FamilyTreeClient({
  initialPeople,
  initialRelationships,
  members,
  roomCode,
  roomId,
}: FamilyTreeClientProps) {
  const [editingPerson, setEditingPerson] =
    useState<FamilyTreePersonView | null>(null);
  const [positionOverrides, setPositionOverrides] = useState<
    Record<string, { positionX: number; positionY: number }>
  >({});
  const [deletedPersonIds, setDeletedPersonIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [personState, personAction, isPersonPending] = useActionState(
    upsertFamilyTreePerson,
    initialActionState,
  );
  const people = useMemo(
    () =>
      initialPeople
        .filter((person) => !deletedPersonIds.includes(person.id))
        .map((person) => ({
          ...person,
          ...positionOverrides[person.id],
        })),
    [deletedPersonIds, initialPeople, positionOverrides],
  );
  const peopleMap = useMemo(() => createPeopleMap(people), [people]);
  const relationships = useMemo(
    () =>
      initialRelationships.filter(
        (relationship) =>
          peopleMap.has(relationship.fromPersonId) &&
          peopleMap.has(relationship.toPersonId),
      ),
    [initialRelationships, peopleMap],
  );
  const usedMemberIds = new Set(
    people.map((person) => person.roomMemberUserId).filter(Boolean),
  );

  useEffect(() => {
    if (!personState.success) return;
    const timer = window.setTimeout(() => {
      setEditingPerson(null);
      setToast("บันทึกคนในผังแล้ว");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [personState.success]);

  /** เริ่มลาก card และบันทึกตำแหน่งตอนปล่อยเมาส์หรือยกนิ้ว */
  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    person: FamilyTreePersonView,
  ) {
    if ((event.target as HTMLElement).closest("button")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(person.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = person.positionX;
    const originY = person.positionY;

    function handlePointerMove(moveEvent: PointerEvent) {
      const positionX = clampPosition(originX + moveEvent.clientX - startX, 2600);
      const positionY = clampPosition(originY + moveEvent.clientY - startY, 1600);
      setPositionOverrides((current) => ({
        ...current,
        [person.id]: { positionX, positionY },
      }));
    }

    function handlePointerUp(upEvent: PointerEvent) {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setDraggingId(null);
      const positionX = clampPosition(originX + upEvent.clientX - startX, 2600);
      const positionY = clampPosition(originY + upEvent.clientY - startY, 1600);
      const formData = new FormData();
      formData.set("personId", person.id);
      formData.set("positionX", String(positionX));
      formData.set("positionY", String(positionY));
      formData.set("roomCode", roomCode);
      formData.set("roomId", roomId);
      startTransition(async () => {
        const result = await moveFamilyTreePerson(formData);
        if (result.error) setToast(result.error);
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  /** ลบคนออกจากผังหลังผู้ใช้ยืนยัน */
  function handleDeletePerson(person: FamilyTreePersonView) {
    if (!window.confirm(`ลบ ${person.displayName} ออกจากผังใช่ไหม?`)) return;
    const formData = new FormData();
    formData.set("personId", person.id);
    formData.set("roomCode", roomCode);
    formData.set("roomId", roomId);
    startTransition(async () => {
      const result = await deleteFamilyTreePerson(formData);
      if (result.error) {
        setToast(result.error);
        return;
      }
      setDeletedPersonIds((current) => [...current, person.id]);
      setToast("ลบออกจากผังแล้ว");
    });
  }

  return (
    <div className={styles.layout}>
      <section className={styles.canvasPanel} aria-label="ผังครอบครัว">
        <div className={styles.canvasHeader}>
          <div>
            <h2>ผังของบ้านนี้</h2>
            <p>ลากการ์ดเพื่อจัดตำแหน่งในผังครอบครัว</p>
          </div>
          <span>{people.length} คนในผัง</span>
        </div>
        <div className={styles.canvas}>
          <svg className={styles.lines} aria-hidden>
            {relationships.map((relationship) => {
              const from = peopleMap.get(relationship.fromPersonId);
              const to = peopleMap.get(relationship.toPersonId);
              if (!from || !to) return null;
              const x1 = from.positionX + PERSON_CARD_WIDTH / 2;
              const y1 = from.positionY + PERSON_CARD_HEIGHT / 2;
              const x2 = to.positionX + PERSON_CARD_WIDTH / 2;
              const y2 = to.positionY + PERSON_CARD_HEIGHT / 2;
              return (
                <line
                  data-type={relationship.relationshipType}
                  key={relationship.id}
                  x1={x1}
                  x2={x2}
                  y1={y1}
                  y2={y2}
                />
              );
            })}
          </svg>
          {people.length === 0 ? (
            <div className={styles.emptyCanvas}>
              <h3>ยังไม่มีใครในผัง</h3>
              <p>เพิ่มสมาชิกจริงหรือ guest เพื่อเริ่มจัดผัง</p>
            </div>
          ) : null}
          {people.map((person) => (
            <div
              className={styles.personCard}
              data-dragging={draggingId === person.id}
              key={person.id}
              onPointerDown={(event) => handlePointerDown(event, person)}
              style={{
                transform: `translate(${person.positionX}px, ${person.positionY}px)`,
              }}
            >
              <img alt="" src={person.avatarUrl} />
              <div>
                <strong>{person.displayName}</strong>
                <span>{ROLE_LABEL[person.role]}</span>
              </div>
              <div className={styles.cardActions}>
                <button
                  aria-label={`แก้ไข ${person.displayName}`}
                  onClick={() => setEditingPerson(person)}
                  type="button"
                >
                  <Pencil size={14} />
                </button>
                <button
                  aria-label={`ลบ ${person.displayName}`}
                  onClick={() => handleDeletePerson(person)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className={styles.sidePanel}>
        <section className={styles.formCard}>
          <div className={styles.sectionHead}>
            <UserPlus size={18} />
            <div>
              <h2>{editingPerson ? "แก้ไขคนในผัง" : "เพิ่มคนในผัง"}</h2>
              <p>เลือกจากสมาชิกห้องหรือเพิ่มเป็น guest ก็ได้</p>
            </div>
          </div>
          <form action={personAction} className={styles.form}>
            <input
              name="personId"
              type="hidden"
              value={editingPerson?.id ?? ""}
            />
            <input name="roomCode" type="hidden" value={roomCode} />
            <input name="roomId" type="hidden" value={roomId} />
            <input
              name="positionX"
              type="hidden"
              value={editingPerson?.positionX ?? 160 + people.length * 32}
            />
            <input
              name="positionY"
              type="hidden"
              value={editingPerson?.positionY ?? 120 + people.length * 28}
            />
            <label>
              <span>สมาชิกในห้อง (ไม่บังคับ)</span>
              <select
                defaultValue={editingPerson?.roomMemberUserId ?? ""}
                name="roomMemberUserId"
              >
                <option value="">เพิ่มเป็น guest</option>
                {members.map((member) => (
                  <option
                    disabled={
                      usedMemberIds.has(member.userId) &&
                      editingPerson?.roomMemberUserId !== member.userId
                    }
                    key={member.userId}
                    value={member.userId}
                  >
                    {member.displayName} (@{member.username})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>ชื่อที่แสดง</span>
              <input
                defaultValue={editingPerson?.displayName ?? ""}
                name="displayName"
                placeholder="เช่น แม่, พี่นนท์, น้องมายด์"
                required
              />
              <FieldErrors messages={personState.fieldErrors?.displayName} />
            </label>
            <label>
              <span>บทบาทในผัง</span>
              <select defaultValue={editingPerson?.role ?? "child"} name="role">
                <option value="parent">พ่อ/แม่</option>
                <option value="child">ลูก</option>
                <option value="sibling">พี่น้อง</option>
              </select>
            </label>
            <input
              name="avatarUrl"
              type="hidden"
              value={editingPerson?.avatarUrl ?? ""}
            />
            {personState.error ? (
              <p className={styles.error}>{personState.error}</p>
            ) : null}
            <div className={styles.formActions}>
              {editingPerson ? (
                <Button
                  onClick={() => setEditingPerson(null)}
                  type="button"
                  variant="default"
                >
                  ยกเลิก
                </Button>
              ) : null}
              <Button pending={isPersonPending} variant="primary">
                {editingPerson ? "บันทึกคนนี้" : "เพิ่มคน"}
              </Button>
            </div>
          </form>
        </section>

      </aside>
      {toast ? (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      ) : null}
    </div>
  );
}
