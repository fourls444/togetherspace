export type InteractiveBoardItem = {
  id: string;
  pollMaxVotesPerUser: number;
  checklistItems: {
    id: string;
    isDone: boolean;
  }[];
  pollOptions: {
    id: string;
    voteCount: number;
    votedByCurrentUser: boolean;
  }[];
};

/** สลับสถานะ checklist รายการเดียวโดยรักษาข้อมูลส่วนอื่นไว้เหมือนเดิม */
export function toggleChecklistState<T extends InteractiveBoardItem>(
  items: T[],
  boardItemId: string,
  checklistItemId: string,
): T[] {
  return items.map((item) =>
    item.id === boardItemId
      ? {
          ...item,
          checklistItems: item.checklistItems.map((checklistItem) =>
            checklistItem.id === checklistItemId
              ? { ...checklistItem, isDone: !checklistItem.isDone }
              : checklistItem,
          ),
        }
      : item,
  ) as T[];
}

/** สลับคะแนนโหวตเฉพาะโพลที่เลือก โดยรองรับทั้งโหมดข้อเดียวและหลายข้อ */
export function togglePollVoteState<T extends InteractiveBoardItem>(
  items: T[],
  boardItemId: string,
  optionId: string,
): T[] {
  return items.map((item) => {
    if (item.id !== boardItemId) return item;

    const target = item.pollOptions.find((option) => option.id === optionId);
    if (!target) return item;

    const selectedCount = item.pollOptions.filter(
      (option) => option.votedByCurrentUser,
    ).length;
    if (
      !target.votedByCurrentUser &&
      item.pollMaxVotesPerUser > 1 &&
      selectedCount >= item.pollMaxVotesPerUser
    ) {
      return item;
    }

    const nextOptions = item.pollOptions.map((option) => {
      if (option.id === optionId) {
        const selected = !option.votedByCurrentUser;
        return {
          ...option,
          votedByCurrentUser: selected,
          voteCount: Math.max(0, option.voteCount + (selected ? 1 : -1)),
        };
      }

      if (
        item.pollMaxVotesPerUser <= 1 &&
        !target.votedByCurrentUser &&
        option.votedByCurrentUser
      ) {
        return {
          ...option,
          votedByCurrentUser: false,
          voteCount: Math.max(0, option.voteCount - 1),
        };
      }

      return option;
    });

    return { ...item, pollOptions: nextOptions };
  }) as T[];
}

/** จัดลำดับ board item ตาม id ที่ลากวาง และเก็บ item ที่ไม่อยู่ในลำดับใหม่ไว้ท้ายรายการ */
export function reorderBoardItems<T extends { id: string }>(
  items: T[],
  orderedItemIds: string[],
): T[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const usedIds = new Set<string>();
  const orderedItems: T[] = [];

  for (const id of orderedItemIds) {
    const item = itemById.get(id);
    if (!item || usedIds.has(id)) continue;
    orderedItems.push(item);
    usedIds.add(id);
  }

  return [...orderedItems, ...items.filter((item) => !usedIds.has(item.id))];
}

/** คำนวณเปอร์เซ็นต์คะแนนของตัวเลือกโพล โดยปัดเป็นจำนวนเต็มเพื่อแสดงเป็น progress bar */
export function getPollOptionPercent(voteCount: number, totalVotes: number) {
  if (totalVotes <= 0) return 0;
  return Math.round((voteCount / totalVotes) * 100);
}
