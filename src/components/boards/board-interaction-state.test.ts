import assert from "node:assert/strict";
import test from "node:test";

import {
  getBoardFilterCounts,
  getPollOptionPercent,
  getVisibleBoardItems,
  reorderBoardItems,
  toggleChecklistState,
  togglePollVoteState,
  type InteractiveBoardItem,
} from "./board-interaction-state.ts";

const items: InteractiveBoardItem[] = [
  {
    id: "board-1",
    pollMaxVotesPerUser: 1,
    checklistItems: [
      { id: "check-1", isDone: false },
      { id: "check-2", isDone: true },
    ],
    pollOptions: [
      { id: "option-1", voteCount: 1, votedByCurrentUser: true },
      { id: "option-2", voteCount: 0, votedByCurrentUser: false },
    ],
  },
];

test("สลับ checklist ได้ทั้งเสร็จและยังไม่เสร็จ", () => {
  const checked = toggleChecklistState(items, "board-1", "check-1");
  assert.equal(checked[0]?.checklistItems[0]?.isDone, true);

  const unchecked = toggleChecklistState(checked, "board-1", "check-1");
  assert.equal(unchecked[0]?.checklistItems[0]?.isDone, false);
});

test("โพลข้อเดียวย้ายคะแนนจากตัวเลือกเดิมไปตัวเลือกใหม่", () => {
  const next = togglePollVoteState(items, "board-1", "option-2");

  assert.deepEqual(
    next[0]?.pollOptions.map((option) => ({
      count: option.voteCount,
      selected: option.votedByCurrentUser,
    })),
    [
      { count: 0, selected: false },
      { count: 1, selected: true },
    ],
  );
});

test("กดตัวเลือกเดิมอีกครั้งแล้วยกเลิกโหวตได้", () => {
  const next = togglePollVoteState(items, "board-1", "option-1");

  assert.equal(next[0]?.pollOptions[0]?.votedByCurrentUser, false);
  assert.equal(next[0]?.pollOptions[0]?.voteCount, 0);
});

test("โพลหลายข้อเพิ่มคะแนนโดยไม่กระทบตัวเลือกเดิม", () => {
  const multipleItems = [{ ...items[0]!, pollMaxVotesPerUser: 10 }];
  const next = togglePollVoteState(multipleItems, "board-1", "option-2");

  assert.equal(next[0]?.pollOptions[0]?.votedByCurrentUser, true);
  assert.equal(next[0]?.pollOptions[1]?.votedByCurrentUser, true);
});

test("จัดลำดับ board item ตาม id ที่ลากวางโดยคง item ที่ไม่รู้จักไว้ท้ายสุด", () => {
  const boardItems = [
    { ...items[0]!, id: "board-1" },
    { ...items[0]!, id: "board-2" },
    { ...items[0]!, id: "board-3" },
  ];

  const next = reorderBoardItems(boardItems, ["board-3", "board-1"]);

  assert.deepEqual(
    next.map((item) => item.id),
    ["board-3", "board-1", "board-2"],
  );
});

test("คำนวณเปอร์เซ็นต์โพลจากคะแนนรวมและกันกรณีไม่มีคะแนน", () => {
  assert.equal(getPollOptionPercent(2, 5), 40);
  assert.equal(getPollOptionPercent(1, 3), 33);
  assert.equal(getPollOptionPercent(0, 0), 0);
});

test("กรองรายการบอร์ดตามประเภทและแยกรายการที่จัดเก็บออกจากรายการปกติ", () => {
  const boardItems = [
    { id: "note-1", itemType: "note", archivedAt: null },
    { id: "checklist-1", itemType: "checklist", archivedAt: null },
    { id: "poll-1", itemType: "poll", archivedAt: null },
    { id: "note-2", itemType: "note", archivedAt: "2026-08-13T10:00:00.000Z" },
  ] as const;

  assert.deepEqual(
    getVisibleBoardItems(boardItems, "all").map((item) => item.id),
    ["note-1", "checklist-1", "poll-1"],
  );
  assert.deepEqual(
    getVisibleBoardItems(boardItems, "note").map((item) => item.id),
    ["note-1"],
  );
  assert.deepEqual(
    getVisibleBoardItems(boardItems, "archived").map((item) => item.id),
    ["note-2"],
  );
});

test("นับจำนวนรายการสำหรับแท็บบอร์ดแต่ละประเภท", () => {
  const boardItems = [
    { id: "note-1", itemType: "note", archivedAt: null },
    { id: "checklist-1", itemType: "checklist", archivedAt: null },
    { id: "poll-1", itemType: "poll", archivedAt: null },
    { id: "note-2", itemType: "note", archivedAt: "2026-08-13T10:00:00.000Z" },
  ] as const;

  assert.deepEqual(getBoardFilterCounts(boardItems), {
    all: 3,
    archived: 1,
    checklist: 1,
    note: 1,
    poll: 1,
  });
});
