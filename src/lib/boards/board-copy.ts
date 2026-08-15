import type { BoardItemType, RoomType } from "@/lib/types/database";

type BoardActionCopy = {
  description: string;
  label: string;
  modalTitle: string;
  pendingText: string;
  submitLabel: string;
};

export type BoardCopy = {
  actions: Record<BoardItemType, BoardActionCopy>;
  empty: {
    description: string;
    title: string;
  };
  itemTypeLabels: Record<BoardItemType, string>;
  lead: string;
  pageTitle: string;
  panelTitle: string;
  placeholders: {
    body: string;
    checklistItems: string;
    pollOptions: string;
    title: string;
  };
  starterSuggestions: {
    body: string;
    checklistItems?: string;
    pollOptions?: string;
    title: string;
    type: BoardItemType;
  }[];
};

const COMMON_ITEM_LABELS: Record<BoardItemType, string> = {
  checklist: "เช็คลิสต์",
  note: "โน้ต",
  poll: "โพล",
};

const BOARD_COPY: Record<RoomType, BoardCopy> = {
  couple: {
    actions: {
      checklist: {
        description: "แตกสิ่งที่อยากทำด้วยกันให้เป็นขั้นตอนเล็กๆ",
        label: "เช็คลิสต์เดต",
        modalTitle: "เพิ่มเช็คลิสต์เดต",
        pendingText: "กำลังเพิ่มเช็คลิสต์...",
        submitLabel: "เพิ่มเช็คลิสต์",
      },
      note: {
        description: "เก็บไอเดีย ข้อความ หรือสิ่งที่อยากจำไว้ด้วยกัน",
        label: "ความคิด",
        modalTitle: "เพิ่มความคิด",
        pendingText: "กำลังเพิ่มความคิด...",
        submitLabel: "เพิ่มความคิด",
      },
      poll: {
        description: "ให้ทั้งสองคนช่วยกันเลือกแบบไม่ต้องไถแชทยาวๆ",
        label: "โหวตกัน",
        modalTitle: "เพิ่มโพลของเรา",
        pendingText: "กำลังเพิ่มโพล...",
        submitLabel: "เพิ่มโพล",
      },
    },
    empty: {
      description: "เริ่มจากไอเดียเดต เช็คลิสต์ทริป หรือโพลเล็กๆ ของสองคน",
      title: "ยังไม่มีอะไรบนบอร์ดของเรา",
    },
    itemTypeLabels: COMMON_ITEM_LABELS,
    lead: "เก็บไอเดียเดต เรื่องที่อยากทำ และตัวเลือกที่อยากตัดสินใจด้วยกัน",
    pageTitle: "บอร์ดของเรา",
    panelTitle: "บนบอร์ดตอนนี้",
    placeholders: {
      body: "เล่าเพิ่มสั้นๆ ว่าคิดอะไรอยู่",
      checklistItems: "เลือกร้าน\nจองเวลา\nเตรียมของเล็กๆ",
      pollOptions: "ร้านโปรด\nคาเฟ่ใหม่\nทำอาหารด้วยกัน",
      title: "เช่น เดตเสาร์นี้",
    },
    starterSuggestions: [
      {
        body: "จดร้าน สถานที่ หรือกิจกรรมที่อยากลองด้วยกัน",
        title: "ลิสต์เดตที่อยากไป",
        type: "note",
      },
      {
        body: "แตกสิ่งที่ต้องเตรียมก่อนออกไปเที่ยว",
        checklistItems: "เลือกร้าน\nจองเวลา\nเตรียมของเล็กๆ",
        title: "เตรียมตัวก่อนเดต",
        type: "checklist",
      },
      {
        body: "ให้ช่วยกันเลือกแบบเร็วๆ",
        pollOptions: "ร้านโปรด\nคาเฟ่ใหม่\nทำอาหารด้วยกัน",
        title: "คืนนี้กินอะไรดี",
        type: "poll",
      },
    ],
  },
  family: {
    actions: {
      checklist: {
        description: "แบ่งงานบ้าน ธุระ หรือของที่ต้องเตรียมให้เห็นชัด",
        label: "งานที่ต้องช่วยกัน",
        modalTitle: "เพิ่มงานที่ต้องช่วยกัน",
        pendingText: "กำลังเพิ่มงาน...",
        submitLabel: "เพิ่มงาน",
      },
      note: {
        description: "ฝากข้อความหรือเรื่องสำคัญให้ทุกคนในบ้านเห็นร่วมกัน",
        label: "ประกาศบ้าน",
        modalTitle: "เพิ่มประกาศบ้าน",
        pendingText: "กำลังเพิ่มประกาศ...",
        submitLabel: "เพิ่มประกาศ",
      },
      poll: {
        description: "ใช้ตัดสินใจเรื่องของบ้านหรือแผนครอบครัวร่วมกัน",
        label: "ขอความเห็น",
        modalTitle: "เพิ่มคำถามครอบครัว",
        pendingText: "กำลังเพิ่มคำถาม...",
        submitLabel: "เพิ่มคำถาม",
      },
    },
    empty: {
      description:
        "เริ่มจากประกาศบ้าน เช็คลิสต์ซื้อของ หรือคำถามที่อยากให้ทุกคนช่วยเลือก",
      title: "บอร์ดบ้านยังว่างอยู่",
    },
    itemTypeLabels: {
      checklist: "งานบ้าน",
      note: "ประกาศ",
      poll: "คำถาม",
    },
    lead: "ฝากเรื่องสำคัญ งานที่ต้องช่วยกันทำ และการตัดสินใจของครอบครัวไว้ในที่เดียว",
    pageTitle: "บอร์ดของบ้าน",
    panelTitle: "เรื่องบนบอร์ด",
    placeholders: {
      body: "รายละเอียดที่ทุกคนควรรู้",
      checklistItems: "ซื้อของเข้าบ้าน\nจ่ายบิล\nเตรียมของสำหรับทริป",
      pollOptions: "เสาร์นี้\nอาทิตย์นี้\nสัปดาห์หน้า",
      title: "เช่น ซื้อของเข้าบ้าน",
    },
    starterSuggestions: [
      {
        body: "ของใช้ที่ใกล้หมดหรืออยากซื้อเพิ่ม",
        checklistItems: "ของใช้ในครัว\nของใช้ในห้องน้ำ\nของกินเข้าบ้าน",
        title: "ของที่ต้องซื้อเข้าบ้าน",
        type: "checklist",
      },
      {
        body: "เรื่องที่อยากให้ทุกคนเห็นก่อน",
        title: "ประกาศประจำสัปดาห์",
        type: "note",
      },
      {
        body: "ช่วยกันเลือกวันหรือแผนที่สะดวกที่สุด",
        pollOptions: "เสาร์นี้\nอาทิตย์นี้\nสัปดาห์หน้า",
        title: "นัดรวมครอบครัววันไหนดี",
        type: "poll",
      },
    ],
  },
  friend: {
    actions: {
      checklist: {
        description: "รวมของที่ต้องเตรียม งานที่แบ่งกันทำ หรือเช็คลิสต์ทริป",
        label: "เช็คลิสต์",
        modalTitle: "เพิ่มเช็คลิสต์",
        pendingText: "กำลังเพิ่มเช็คลิสต์...",
        submitLabel: "เพิ่มเช็คลิสต์",
      },
      note: {
        description: "โยนไอเดีย นัดหมาย หรือเรื่องที่อยากแปะไว้ให้เพื่อนเห็น",
        label: "ไอเดีย",
        modalTitle: "เพิ่มไอเดีย",
        pendingText: "กำลังเพิ่มไอเดีย...",
        submitLabel: "เพิ่มไอเดีย",
      },
      poll: {
        description: "โหวตวัน ร้าน หรือแผนต่อไปของกลุ่ม",
        label: "โหวตแผน",
        modalTitle: "เพิ่มโหวตแผน",
        pendingText: "กำลังเพิ่มโหวต...",
        submitLabel: "เพิ่มโหวต",
      },
    },
    empty: {
      description:
        "เริ่มจากไอเดียทริป เช็คลิสต์ของที่ต้องเตรียม หรือโหวตร้านนัดเจอ",
      title: "บอร์ดยังโล่งอยู่",
    },
    itemTypeLabels: {
      checklist: "เช็คลิสต์",
      note: "ไอเดีย",
      poll: "โหวต",
    },
    lead: "โยนไอเดีย แบ่งงาน และโหวตแผนของกลุ่มโดยไม่ต้องย้อนหาในแชท",
    pageTitle: "บอร์ด",
    panelTitle: "แผนและไอเดียตอนนี้",
    placeholders: {
      body: "ใส่รายละเอียดเพิ่มให้เพื่อนเข้าใจง่าย",
      checklistItems: "จองที่พัก\nหารถ\nซื้อของกิน",
      pollOptions: "ร้านเดิม\nคาเฟ่ใหม่\nไปต่างจังหวัด",
      title: "เช่น ทริปปลายเดือน",
    },
    starterSuggestions: [
      {
        body: "โยนสถานที่ ร้าน หรือกิจกรรมที่อยากชวนเพื่อนไป",
        title: "ไอเดียทริปรอบหน้า",
        type: "note",
      },
      {
        body: "ของที่ต้องเตรียมและงานที่แบ่งกันรับผิดชอบ",
        checklistItems: "จองที่พัก\nหารรถ\nซื้อของกิน",
        title: "เช็คลิสต์ก่อนออกทริป",
        type: "checklist",
      },
      {
        body: "ช่วยกันเลือกให้จบแบบไม่ต้องถามซ้ำ",
        pollOptions: "ร้านเดิม\nคาเฟ่ใหม่\nไปต่างจังหวัด",
        title: "นัดเจอกันวันไหนดี",
        type: "poll",
      },
    ],
  },
};

/** คืนชุดข้อความของบอร์ดตามประเภทห้อง เพื่อให้ UI ใช้คำสม่ำเสมอทุกจุด */
export function getBoardCopy(type: RoomType) {
  return BOARD_COPY[type];
}
