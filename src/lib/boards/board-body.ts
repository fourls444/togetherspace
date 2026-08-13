export type BoardBodyBlock =
  | {
      text: string;
      type: "p";
    }
  | {
      items: string[];
      type: "ol" | "ul";
    };

const bulletPattern = /^[-*]\s+(.+)$/;
const orderedPattern = /^\d+[.)]\s+(.+)$/;

/** แปลงข้อความรายละเอียดบอร์ดให้เป็นย่อหน้า bullet หรือ numbered list แบบง่ายๆ */
export function parseBoardBody(body: string): BoardBodyBlock[] {
  const blocks: BoardBodyBlock[] = [];
  let activeList: Extract<BoardBodyBlock, { type: "ol" | "ul" }> | null = null;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      activeList = null;
      continue;
    }

    const bullet = bulletPattern.exec(line);
    const ordered = orderedPattern.exec(line);
    const listType = bullet ? "ul" : ordered ? "ol" : null;
    const listText = bullet?.[1] ?? ordered?.[1] ?? null;

    if (listType && listText) {
      if (!activeList || activeList.type !== listType) {
        activeList = { items: [], type: listType };
        blocks.push(activeList);
      }
      activeList.items.push(listText.trim());
      continue;
    }

    activeList = null;
    blocks.push({ text: line, type: "p" });
  }

  return blocks;
}
