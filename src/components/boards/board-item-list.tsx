import {
  archiveBoardItem,
  toggleChecklistItem,
  updateBoardItem,
  updateChecklistItem,
  updatePollOption,
  votePollOption,
} from "@/features/boards/actions";
import { Button } from "@/components/ui/button";
import formStyles from "@/components/ui/form.module.css";
import type { BoardItemType } from "@/lib/types/database";
import styles from "@/components/boards/board-item-list.module.css";

export type BoardItemView = {
  id: string;
  itemType: BoardItemType;
  title: string;
  body: string | null;
  createdAt: string;
  pollMaxVotesPerUser: number;
  checklistItems: {
    id: string;
    text: string;
    isDone: boolean;
    sortOrder: number;
  }[];
  pollOptions: {
    id: string;
    label: string;
    sortOrder: number;
    voteCount: number;
    votedByCurrentUser: boolean;
  }[];
};

type BoardItemListProps = {
  items: BoardItemView[];
  roomCode: string;
  roomId: string;
};

/** แสดงรายการ card บน board โดยแยก render ตามประเภท note, checklist และ poll */
export function BoardItemList({ items, roomCode, roomId }: BoardItemListProps) {
  if (!items.length) {
    return (
      <div className={styles.empty}>
        <h2>บอร์ดยังว่างอยู่</h2>
        <p>ลองเพิ่ม note, checklist หรือ poll แรกของห้องนี้ได้เลย</p>
      </div>
    );
  }

  return (
    <section aria-label="รายการบนบอร์ด" className={styles.grid}>
      {items.map((item) => (
        <article className={styles.card} key={item.id}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.type}>{item.itemType}</p>
              <h2 className={styles.title}>{item.title}</h2>
            </div>
            <form action={archiveBoardItem}>
              <input name="roomId" type="hidden" value={roomId} />
              <input name="roomCode" type="hidden" value={roomCode} />
              <input name="boardItemId" type="hidden" value={item.id} />
              <Button type="submit" variant="danger">
                ลบ
              </Button>
            </form>
          </div>

          {item.body ? <p className={styles.body}>{item.body}</p> : null}

          <details className={styles.editBox}>
            <summary>แก้ไข card</summary>
            <form action={updateBoardItem} className={styles.editForm}>
              <input name="roomId" type="hidden" value={roomId} />
              <input name="roomCode" type="hidden" value={roomCode} />
              <input name="boardItemId" type="hidden" value={item.id} />
              <label className={formStyles.label} htmlFor={`${item.id}-title`}>
                หัวข้อ
              </label>
              <input
                className={formStyles.control}
                defaultValue={item.title}
                id={`${item.id}-title`}
                maxLength={120}
                name="title"
                required
              />
              <label className={formStyles.label} htmlFor={`${item.id}-body`}>
                รายละเอียด
              </label>
              <textarea
                className={formStyles.control}
                defaultValue={item.body ?? ""}
                id={`${item.id}-body`}
                maxLength={1000}
                name="body"
                rows={3}
              />
              <Button type="submit">บันทึก card</Button>
            </form>
          </details>

          {item.itemType === "checklist" ? (
            <ChecklistItems
              items={item.checklistItems}
              roomCode={roomCode}
              roomId={roomId}
            />
          ) : null}

          {item.itemType === "poll" ? (
            <PollOptions item={item} roomCode={roomCode} roomId={roomId} />
          ) : null}
        </article>
      ))}
    </section>
  );
}

/** แสดง checklist พร้อมปุ่ม toggle ที่ส่ง Server Action แบบ progressive enhancement */
function ChecklistItems({
  items,
  roomCode,
  roomId,
}: {
  items: BoardItemView["checklistItems"];
  roomCode: string;
  roomId: string;
}) {
  return (
    <ul className={styles.checklist}>
      {items.map((item) => (
        <li className={styles.checklistItem} key={item.id}>
          <form action={toggleChecklistItem}>
            <input name="roomId" type="hidden" value={roomId} />
            <input name="roomCode" type="hidden" value={roomCode} />
            <input name="checklistItemId" type="hidden" value={item.id} />
            <input name="isDone" type="hidden" value={String(!item.isDone)} />
            <button
              aria-label={
                item.isDone
                  ? "ยกเลิกสถานะเสร็จแล้ว"
                  : "ทำเครื่องหมายว่าเสร็จแล้ว"
              }
              className={styles.checkboxButton}
              title={item.isDone ? "ยกเลิก" : "ทำเสร็จ"}
              type="submit"
            >
              {item.isDone ? "✓" : ""}
            </button>
          </form>
          <span className={item.isDone ? styles.doneText : ""}>{item.text}</span>
          <details className={styles.inlineEdit}>
            <summary>แก้ไข</summary>
            <form action={updateChecklistItem} className={styles.inlineEditForm}>
              <input name="roomId" type="hidden" value={roomId} />
              <input name="roomCode" type="hidden" value={roomCode} />
              <input name="checklistItemId" type="hidden" value={item.id} />
              <input
                className={formStyles.control}
                defaultValue={item.text}
                maxLength={200}
                name="text"
                required
              />
              <Button type="submit">บันทึก</Button>
            </form>
          </details>
        </li>
      ))}
    </ul>
  );
}

/** แสดงตัวเลือก poll พร้อมจำนวน vote และสถานะที่ผู้ใช้เคยโหวต */
function PollOptions({
  item,
  roomCode,
  roomId,
}: {
  item: BoardItemView;
  roomCode: string;
  roomId: string;
}) {
  const selectedCount = item.pollOptions.filter(
    (option) => option.votedByCurrentUser,
  ).length;
  const isMultipleVote = item.pollMaxVotesPerUser > 1;
  const hasReachedLimit = selectedCount >= item.pollMaxVotesPerUser;

  return (
    <>
      <p className={styles.pollHint}>
        {isMultipleVote
          ? "โหวตได้หลายข้อ และยกเลิกโหวตได้เสมอ"
          : "โหวตได้ข้อเดียว และยกเลิกโหวตได้เสมอ"}
      </p>
      <ul className={styles.poll}>
        {item.pollOptions.map((option) => {
          const cannotAddVote =
            isMultipleVote && !option.votedByCurrentUser && hasReachedLimit;
          const buttonText = option.votedByCurrentUser
            ? "ยกเลิกโหวต"
            : "โหวต";

          return (
            <li className={styles.pollOption} key={option.id}>
              <form action={votePollOption}>
                <input name="roomId" type="hidden" value={roomId} />
                <input name="roomCode" type="hidden" value={roomCode} />
                <input name="boardItemId" type="hidden" value={item.id} />
                <input name="optionId" type="hidden" value={option.id} />
                <Button disabled={cannotAddVote} type="submit">
                  {buttonText}
                </Button>
              </form>
              <span>{option.label}</span>
              <span className={styles.voteCount}>{option.voteCount} vote</span>
              <details className={styles.inlineEdit}>
                <summary>แก้ไข</summary>
                <form action={updatePollOption} className={styles.inlineEditForm}>
                  <input name="roomId" type="hidden" value={roomId} />
                  <input name="roomCode" type="hidden" value={roomCode} />
                  <input name="optionId" type="hidden" value={option.id} />
                  <input
                    className={formStyles.control}
                    defaultValue={option.label}
                    maxLength={120}
                    name="label"
                    required
                  />
                  <Button type="submit">บันทึก</Button>
                </form>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}
