"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createFinanceExpense,
  deleteFinanceExpense,
  updateFinanceExpense,
} from "@/features/finance/actions";
import { calculateFinanceSummary, formatBaht } from "@/lib/finance/summary";
import { getFinanceRoomConfig } from "@/lib/finance/room-type";
import type { RoomType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { FinanceTypeWorkspace } from "./finance-type-workspace";
import styles from "./finance.module.css";

export type FinanceMember = {
  userId: string;
  displayName: string;
};

export type FinanceExpenseView = {
  id: string;
  title: string;
  amountCents: number;
  expenseDate: string;
  paidBy: string;
  createdBy: string;
  category: string;
  tripId: string | null;
  fundId: string | null;
  note: string | null;
  splits: { userId: string; amountCents: number }[];
};

export type FinanceTypeData = {
  trips: { id: string; name: string; startDate: string | null; endDate: string | null }[];
  funds: { id: string; name: string; purpose: "trip" | "date"; targetCents: number | null; contributedCents: number }[];
  incomes: { id: string; userId: string; source: string; amountCents: number; incomeMonth: string }[];
  budgets: { id: string; category: string; budgetMonth: string; limitCents: number }[];
  repayments: { id: string; fromUserId: string; toUserId: string; amountCents: number; repaidAt: string }[];
};

type EditorValue = {
  expense?: FinanceExpenseView;
  title: string;
  amount: string;
  expenseDate: string;
  paidBy: string;
  category: string;
  tripId: string;
  fundId: string;
  note: string;
  splitMode: "equal" | "custom";
  participantIds: string[];
  customAmounts: Record<string, string>;
};

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function createEditor(members: FinanceMember[], userId: string, expense?: FinanceExpenseView): EditorValue {
  if (!expense) {
    return {
      title: "",
      amount: "",
      expenseDate: todayKey(),
      paidBy: userId,
      category: "",
      tripId: "",
      fundId: "",
      note: "",
      splitMode: "equal",
      participantIds: members.map((member) => member.userId),
      customAmounts: {},
    };
  }

  const amounts = expense.splits.map((split) => split.amountCents);
  const isEqual = Math.max(...amounts) - Math.min(...amounts) <= 1;
  return {
    expense,
    title: expense.title,
    amount: (expense.amountCents / 100).toFixed(2),
    expenseDate: expense.expenseDate,
    paidBy: expense.paidBy,
    category: expense.category,
    tripId: expense.tripId ?? "",
    fundId: expense.fundId ?? "",
    note: expense.note ?? "",
    splitMode: isEqual ? "equal" : "custom",
    participantIds: expense.splits.map((split) => split.userId),
    customAmounts: Object.fromEntries(
      expense.splits.map((split) => [split.userId, (split.amountCents / 100).toFixed(2)]),
    ),
  };
}

/** หน้าจอการเงินแบบโต้ตอบ รองรับกรอง สรุปยอด เพิ่ม แก้ไข และลบโดยไม่เพิ่ม dependency ใหม่ */
export function FinanceDashboard({
  currentUserId,
  expenses,
  isOwner,
  members,
  roomCode,
  roomId,
  roomType,
  typeData,
}: {
  currentUserId: string;
  expenses: FinanceExpenseView[];
  isOwner: boolean;
  members: FinanceMember[];
  roomCode: string;
  roomId: string;
  roomType: RoomType;
  typeData: FinanceTypeData;
}) {
  const [month, setMonth] = useState(todayKey().slice(0, 7));
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorValue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinanceExpenseView | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const config = getFinanceRoomConfig(roomType);
  const memberNames = useMemo(
    () => new Map(members.map((member) => [member.userId, member.displayName])),
    [members],
  );
  const visibleExpenses = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("th");
    return expenses.filter(
      (expense) =>
        expense.expenseDate.startsWith(month) &&
        (!keyword || expense.title.toLocaleLowerCase("th").includes(keyword)),
    );
  }, [expenses, month, query]);
  const summary = useMemo(
    () => calculateFinanceSummary(
      visibleExpenses,
      roomType === "friend"
        ? typeData.repayments
            .filter((repayment) => repayment.repaidAt.startsWith(month))
            .map((repayment) => ({
              amountCents: repayment.amountCents,
              fromUserId: repayment.fromUserId,
              toUserId: repayment.toUserId,
            }))
        : [],
    ),
    [month, roomType, typeData.repayments, visibleExpenses],
  );
  const paidByMe = visibleExpenses
    .filter((expense) => expense.paidBy === currentUserId)
    .reduce((total, expense) => total + expense.amountCents, 0);
  const myShare = visibleExpenses.reduce(
    (total, expense) =>
      total + (expense.splits.find((split) => split.userId === currentUserId)?.amountCents ?? 0),
    0,
  );

  /** ส่งฟอร์มไป Server Action และคงหน้าปัจจุบันไว้เพื่อแสดงผลลัพธ์ทันที */
  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const formData = new FormData(event.currentTarget);
    formData.set("participantIds", JSON.stringify(editor.participantIds));
    formData.set("customAmounts", JSON.stringify(editor.customAmounts));
    startTransition(async () => {
      const result = editor.expense
        ? await updateFinanceExpense(formData)
        : await createFinanceExpense({}, formData);
      if (result.error || result.fieldErrors) {
        const fieldMessage = result.fieldErrors
          ? Object.values(result.fieldErrors).flat()[0]
          : undefined;
        setToast({ message: result.error ?? fieldMessage ?? "บันทึกไม่สำเร็จ", tone: "error" });
        return;
      }
      setEditor(null);
      setToast({ message: editor.expense ? "แก้ไขค่าใช้จ่ายแล้ว" : "เพิ่มค่าใช้จ่ายแล้ว", tone: "success" });
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.set("expenseId", deleteTarget.id);
    formData.set("roomId", roomId);
    formData.set("roomCode", roomCode);
    startTransition(async () => {
      const result = await deleteFinanceExpense(formData);
      setToast({ message: result.error ?? "ลบค่าใช้จ่ายแล้ว", tone: result.error ? "error" : "success" });
      if (!result.error) setDeleteTarget(null);
    });
  };

  return (
    <div className={styles.stack}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{config.eyebrow}</p>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
      </section>

      <FinanceTypeWorkspace
        currentUserId={currentUserId}
        expenses={expenses}
        members={members}
        month={month}
        roomCode={roomCode}
        roomId={roomId}
        roomType={roomType}
        typeData={typeData}
      />

      <div className={styles.summaryGrid}>
        <article><span>รวมเดือนนี้</span><strong>{formatBaht(summary.totalCents)}</strong></article>
        <article><span>คุณจ่ายไปแล้ว</span><strong>{formatBaht(paidByMe)}</strong></article>
        <article><span>ส่วนที่คุณต้องจ่าย</span><strong>{formatBaht(myShare)}</strong></article>
        <article><span>ยอดคงเหลือของคุณ</span><strong>{formatBaht(summary.balances.get(currentUserId) ?? 0)}</strong></article>
      </div>

      <section className={styles.contentGrid}>
        <div className={styles.expenseArea}>
          <div className={styles.toolbar}>
            <div>
              <label htmlFor="finance-month">เดือน</label>
              <input id="finance-month" onChange={(event) => setMonth(event.target.value)} type="month" value={month} />
            </div>
            <div className={styles.searchField}>
              <label htmlFor="finance-search">ค้นหารายการ</label>
              <input id="finance-search" onChange={(event) => setQuery(event.target.value)} placeholder="เช่น ค่าอาหาร" type="search" value={query} />
            </div>
          </div>
          <div className={styles.listHeader}>
            <div>
              <h3>รายการค่าใช้จ่าย</h3>
              <span>{visibleExpenses.length} รายการ</span>
            </div>
            <Button onClick={() => setEditor(createEditor(members, currentUserId))} type="button" variant="primary">
              <Plus aria-hidden size={17} /> เพิ่มรายการ
            </Button>
          </div>
          {visibleExpenses.length ? (
            <ul className={styles.expenseList}>
              {visibleExpenses.map((expense) => {
                const canManage = isOwner || expense.createdBy === currentUserId;
                return (
                  <li key={expense.id}>
                    <div className={styles.expenseMain}>
                      <div className={styles.expenseTitle}><strong>{expense.title}</strong><span>{expense.category}</span></div>
                      <span>{expense.expenseDate} · {memberNames.get(expense.paidBy) ?? "สมาชิก"} จ่าย</span>
                    </div>
                    <strong className={styles.amount}>{formatBaht(expense.amountCents)}</strong>
                    {canManage ? (
                      <div className={styles.rowActions}>
                        <Button aria-label={`แก้ไข ${expense.title}`} onClick={() => setEditor(createEditor(members, currentUserId, expense))} type="button"><Pencil size={16} /></Button>
                        <Button aria-label={`ลบ ${expense.title}`} onClick={() => setDeleteTarget(expense)} type="button" variant="danger"><Trash2 size={16} /></Button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}><strong>ยังไม่มีค่าใช้จ่ายในเดือนนี้</strong><p>เพิ่มรายการแรกเพื่อเริ่มแบ่งค่าใช้จ่ายร่วมกัน</p></div>
          )}
        </div>

        <aside className={styles.settlementPanel}>
          <h3>สรุปยอดที่ต้องคืน</h3>
          {summary.settlements.length ? (
            <ul>{summary.settlements.map((item) => <li key={`${item.fromUserId}-${item.toUserId}`}><span><strong>{memberNames.get(item.fromUserId)}</strong> คืนให้ {memberNames.get(item.toUserId)}</span><strong>{formatBaht(item.amountCents)}</strong></li>)}</ul>
          ) : <p>เดือนนี้ไม่มียอดค้างระหว่างสมาชิก</p>}
        </aside>
      </section>

      <Modal description={editor?.expense ? "ปรับข้อมูลและยอดแบ่งของรายการนี้" : "บันทึกว่าใครจ่ายและแบ่งให้ใครบ้าง"} isOpen={Boolean(editor)} onClose={() => !isPending && setEditor(null)} title={editor?.expense ? "แก้ไขค่าใช้จ่าย" : "เพิ่มค่าใช้จ่าย"}>
        {editor ? (
          <form className={styles.editorForm} onSubmit={handleSave}>
            <input name="roomId" type="hidden" value={roomId} /><input name="roomCode" type="hidden" value={roomCode} /><input name="roomType" type="hidden" value={roomType} />
            {editor.expense ? <input name="expenseId" type="hidden" value={editor.expense.id} /> : null}
            <label>ชื่อรายการ<input name="title" onChange={(e) => setEditor({ ...editor, title: e.target.value })} required value={editor.title} /></label>
            <div className={styles.twoColumns}>
              <label>จำนวนเงิน (บาท)<input inputMode="decimal" name="amount" onChange={(e) => setEditor({ ...editor, amount: e.target.value })} required value={editor.amount} /></label>
              <label>วันที่<input name="expenseDate" onChange={(e) => setEditor({ ...editor, expenseDate: e.target.value })} required type="date" value={editor.expenseDate} /></label>
            </div>
            <div className={styles.twoColumns}>
              <label>หมวดค่าใช้จ่าย<select name="category" onChange={(e) => setEditor({ ...editor, category: e.target.value })} required value={editor.category}>{!editor.category ? <option value="">เลือกหมวด</option> : null}{config.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              {roomType === "friend" ? <label>ทริป <small>ไม่บังคับ</small><select name="tripId" onChange={(e) => setEditor({ ...editor, tripId: e.target.value })} value={editor.tripId}><option value="">ไม่ผูกกับทริป</option>{typeData.trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}</select></label> : null}
              {roomType !== "family" ? <label>กองกลาง <small>ไม่บังคับ</small><select name="fundId" onChange={(e) => setEditor({ ...editor, fundId: e.target.value })} value={editor.fundId}><option value="">ไม่หักจากกองกลาง</option>{typeData.funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select></label> : null}
            </div>
            <label>ผู้จ่าย<select name="paidBy" onChange={(e) => setEditor({ ...editor, paidBy: e.target.value })} value={editor.paidBy}>{members.map((member) => <option key={member.userId} value={member.userId}>{member.displayName}</option>)}</select></label>
            <input name="splitMode" type="hidden" value={editor.splitMode} />
            <label>รายละเอียด (ไม่บังคับ)<textarea name="note" onChange={(e) => setEditor({ ...editor, note: e.target.value })} rows={3} value={editor.note} /></label>
            <div className={styles.modalActions}><Button disabled={isPending} onClick={() => setEditor(null)} type="button">ยกเลิก</Button><Button pending={isPending} pendingText="กำลังบันทึก…" variant="primary">บันทึกค่าใช้จ่าย</Button></div>
          </form>
        ) : null}
      </Modal>
      <ConfirmationDialog confirmLabel="ลบค่าใช้จ่าย" description={`รายการ “${deleteTarget?.title ?? ""}” จะถูกลบพร้อมยอดแบ่งทั้งหมด`} isPending={isPending} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} open={Boolean(deleteTarget)} title="ยืนยันการลบรายการ" variant="danger" />
      <Toast message={toast?.message ?? null} onDismiss={() => setToast(null)} tone={toast?.tone} />
    </div>
  );
}
