"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { HeartHandshake, House, Plane, Plus, WalletCards } from "lucide-react";

import {
  createFinanceFund,
  createFinanceIncome,
  createFinanceRepayment,
  createFinanceTrip,
  createFundContribution,
  upsertFinanceBudget,
} from "@/features/finance/actions";
import { getFinanceRoomConfig } from "@/lib/finance/room-type";
import { formatBaht } from "@/lib/finance/summary";
import type { RoomType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import type { FinanceExpenseView, FinanceMember, FinanceTypeData } from "./finance-dashboard";
import styles from "./finance.module.css";

type WorkspaceModal = "trip" | "fund" | "contribution" | "income" | "budget" | "repayment" | null;

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** แสดงพื้นที่ทำงานที่ต่างกันจริงตามประเภทห้องและจัดการข้อมูลเฉพาะประเภทผ่าน modal */
export function FinanceTypeWorkspace({
  currentUserId,
  expenses,
  members,
  month,
  roomCode,
  roomId,
  roomType,
  typeData,
}: {
  currentUserId: string;
  expenses: FinanceExpenseView[];
  members: FinanceMember[];
  month: string;
  roomCode: string;
  roomId: string;
  roomType: RoomType;
  typeData: FinanceTypeData;
}) {
  const [modal, setModal] = useState<WorkspaceModal>(null);
  const [selectedFundId, setSelectedFundId] = useState(typeData.funds[0]?.id ?? "");
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const config = getFinanceRoomConfig(roomType);
  const monthlyExpenses = useMemo(
    () => expenses.filter((expense) => expense.expenseDate.startsWith(month)),
    [expenses, month],
  );
  const monthlyIncomes = typeData.incomes.filter((income) => income.incomeMonth.startsWith(month));
  const monthlyBudgets = typeData.budgets.filter((budget) => budget.budgetMonth.startsWith(month));
  const monthlyRepayments = typeData.repayments.filter((repayment) => repayment.repaidAt.startsWith(month));
  const incomeTotal = monthlyIncomes.reduce((sum, income) => sum + income.amountCents, 0);
  const budgetTotal = monthlyBudgets.reduce((sum, budget) => sum + budget.limitCents, 0);
  const expenseTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const categories = useMemo(() => {
    const values = new Map<string, number>();
    for (const expense of monthlyExpenses) {
      values.set(expense.category, (values.get(expense.category) ?? 0) + expense.amountCents);
    }
    return [...values.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthlyExpenses]);
  const activeFund = typeData.funds.find((fund) => fund.id === selectedFundId) ?? typeData.funds[0];

  /** เรียก Server Action เดียวต่อฟอร์มและแสดงผลลัพธ์โดยไม่พาผู้ใช้ออกจากหน้า */
  const submit = (event: FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>, successMessage: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setToast({ message: result.error, tone: "error" });
        return;
      }
      setModal(null);
      setToast({ message: successMessage, tone: "success" });
    });
  };

  return (
    <>
      <section className={`${styles.typeWorkspace} ${styles[roomType]}`}>
        <div className={styles.typeWorkspaceHeading}>
          <div>
            <p className={styles.eyebrow}>เครื่องมือเฉพาะห้อง</p>
            <h3>{roomType === "friend" ? "จัดการเงินของทริป" : roomType === "couple" ? "วางแผนเงินของเรา" : "ภาพรวมการเงินในบ้าน"}</h3>
          </div>
          <span className={styles.typeBadge}>{roomType === "friend" ? "กลุ่มเพื่อน" : roomType === "couple" ? "คู่รัก" : "ครอบครัว"}</span>
        </div>

        <div className={styles.typeCardGrid}>
          {roomType === "friend" ? (
            <>
              <article className={styles.typeCard}>
                <span className={styles.typeCardIcon}><Plane aria-hidden size={19} /></span>
                <div><p>ทริปที่บันทึกไว้</p><strong>{typeData.trips.length} ทริป</strong></div>
                <p className={styles.typeCardDetail}>{typeData.trips[0]?.name ?? "เริ่มสร้างทริปแรกของกลุ่ม"}</p>
                <Button onClick={() => setModal("trip")} type="button"><Plus size={15} /> เพิ่มทริป</Button>
              </article>
              <FundCard activeFund={activeFund} funds={typeData.funds} onAdd={() => setModal("fund")} onContribute={() => setModal("contribution")} onSelect={setSelectedFundId} />
              <article className={styles.typeCard}>
                <span className={styles.typeCardIcon}><HeartHandshake aria-hidden size={19} /></span>
                <div><p>คืนเงินแล้วเดือนนี้</p><strong>{formatBaht(monthlyRepayments.reduce((sum, item) => sum + item.amountCents, 0))}</strong></div>
                <p className={styles.typeCardDetail}>{monthlyRepayments.length} รายการคืนเงินที่บันทึกแล้ว</p>
                <Button onClick={() => setModal("repayment")} type="button">บันทึกการคืนเงิน</Button>
              </article>
            </>
          ) : null}

          {roomType === "couple" ? (
            <>
              <FundCard activeFund={activeFund} funds={typeData.funds} onAdd={() => setModal("fund")} onContribute={() => setModal("contribution")} onSelect={setSelectedFundId} />
              <article className={styles.typeCard}>
                <span className={styles.typeCardIcon}><HeartHandshake aria-hidden size={19} /></span>
                <div><p>ค่าเดตเดือนนี้</p><strong>{formatBaht(expenseTotal)}</strong></div>
                <p className={styles.typeCardDetail}>{monthlyExpenses.length} ความทรงจำที่มีค่าใช้จ่ายร่วมกัน</p>
              </article>
              <CategoryCard categories={categories} emptyCopy="ยังไม่มีหมวดค่าเดตในเดือนนี้" />
            </>
          ) : null}

          {roomType === "family" ? (
            <>
              <article className={styles.typeCard}>
                <span className={styles.typeCardIcon}><WalletCards aria-hidden size={19} /></span>
                <div><p>รายรับของบ้านเดือนนี้</p><strong>{formatBaht(incomeTotal)}</strong></div>
                <p className={styles.typeCardDetail}>{monthlyIncomes.length} แหล่งรายรับจากสมาชิก</p>
                <Button onClick={() => setModal("income")} type="button"><Plus size={15} /> เพิ่มรายรับ</Button>
              </article>
              <article className={styles.typeCard}>
                <span className={styles.typeCardIcon}><House aria-hidden size={19} /></span>
                <div><p>งบประมาณรวม</p><strong>{formatBaht(budgetTotal)}</strong></div>
                <p className={styles.typeCardDetail}>ใช้แล้ว {formatBaht(expenseTotal)} · เหลือ {formatBaht(budgetTotal - expenseTotal)}</p>
                <Button onClick={() => setModal("budget")} type="button">ตั้งงบรายหมวด</Button>
              </article>
              <CategoryCard categories={categories} emptyCopy="ยังไม่มีค่าใช้จ่ายของบ้านในเดือนนี้" />
            </>
          ) : null}
        </div>
      </section>

      <Modal isOpen={modal === "trip"} onClose={() => !isPending && setModal(null)} title="สร้างทริปใหม่" description="รวมค่าใช้จ่ายของการเดินทางครั้งเดียวกันไว้ด้วยกัน">
        <form className={styles.quickForm} onSubmit={(event) => submit(event, createFinanceTrip, "สร้างทริปแล้ว")}>
          <RoomHiddenFields roomCode={roomCode} roomId={roomId} />
          <label>ชื่อทริป<input name="name" placeholder="เช่น เที่ยวเชียงใหม่" required /></label>
          <div className={styles.twoColumns}><label>วันเริ่ม<input name="startDate" type="date" /></label><label>วันสิ้นสุด<input name="endDate" type="date" /></label></div>
          <ModalActions isPending={isPending} onCancel={() => setModal(null)} submitLabel="สร้างทริป" />
        </form>
      </Modal>

      <Modal isOpen={modal === "fund"} onClose={() => !isPending && setModal(null)} title={roomType === "friend" ? "สร้างกองกลางทริป" : "สร้างกองเดต"} description="ตั้งเป้าหมายได้ หรือเว้นว่างเพื่อสะสมแบบไม่จำกัด">
        <form className={styles.quickForm} onSubmit={(event) => submit(event, createFinanceFund, "สร้างกองกลางแล้ว")}>
          <RoomHiddenFields roomCode={roomCode} roomId={roomId} />
          <input name="purpose" type="hidden" value={roomType === "friend" ? "trip" : "date"} />
          <label>ชื่อกองกลาง<input name="name" placeholder={roomType === "friend" ? "เช่น กองทริปทะเล" : "เช่น กองเดตประจำเดือน"} required /></label>
          <label>เป้าหมาย (บาท) <small>ไม่บังคับ</small><input inputMode="decimal" name="target" placeholder="0.00" /></label>
          <ModalActions isPending={isPending} onCancel={() => setModal(null)} submitLabel="สร้างกองกลาง" />
        </form>
      </Modal>

      <Modal isOpen={modal === "contribution"} onClose={() => !isPending && setModal(null)} title="เพิ่มเงินเข้ากองกลาง" description={activeFund ? `กำลังเพิ่มเงินเข้า “${activeFund.name}”` : "เลือกกองกลางก่อนเพิ่มเงิน"}>
        <form className={styles.quickForm} onSubmit={(event) => submit(event, createFundContribution, "เพิ่มเงินเข้ากองกลางแล้ว")}>
          <RoomHiddenFields roomCode={roomCode} roomId={roomId} />
          <label>กองกลาง<select name="fundId" onChange={(event) => setSelectedFundId(event.target.value)} required value={activeFund?.id ?? ""}>{typeData.funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select></label>
          <div className={styles.twoColumns}><label>จำนวนเงิน (บาท)<input inputMode="decimal" name="amount" required /></label><label>วันที่<input defaultValue={todayKey()} name="contributionDate" required type="date" /></label></div>
          <ModalActions isPending={isPending} onCancel={() => setModal(null)} submitLabel="เพิ่มเงิน" />
        </form>
      </Modal>

      <Modal isOpen={modal === "income"} onClose={() => !isPending && setModal(null)} title="เพิ่มรายรับของครอบครัว" description="บันทึกรายรับของสมาชิกเพื่อดูภาพรวมรายเดือน">
        <form className={styles.quickForm} onSubmit={(event) => submit(event, createFinanceIncome, "เพิ่มรายรับแล้ว")}>
          <RoomHiddenFields roomCode={roomCode} roomId={roomId} />
          <label>เจ้าของรายรับ<select defaultValue={currentUserId} name="userId">{members.map((member) => <option key={member.userId} value={member.userId}>{member.displayName}</option>)}</select></label>
          <label>แหล่งรายรับ<input name="source" placeholder="เช่น เงินเดือน" required /></label>
          <div className={styles.twoColumns}><label>จำนวนเงิน (บาท)<input inputMode="decimal" name="amount" required /></label><label>เดือน<input defaultValue={month} name="incomeMonth" required type="month" /></label></div>
          <ModalActions isPending={isPending} onCancel={() => setModal(null)} submitLabel="บันทึกรายรับ" />
        </form>
      </Modal>

      <Modal isOpen={modal === "budget"} onClose={() => !isPending && setModal(null)} title="ตั้งงบประมาณรายหมวด" description="บันทึกซ้ำหมวดเดิมในเดือนเดียวกันเพื่อปรับวงเงิน">
        <form className={styles.quickForm} onSubmit={(event) => submit(event, upsertFinanceBudget, "บันทึกงบประมาณแล้ว")}>
          <RoomHiddenFields roomCode={roomCode} roomId={roomId} />
          <label>หมวด<select name="category">{config.categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <div className={styles.twoColumns}><label>วงเงิน (บาท)<input inputMode="decimal" name="amount" required /></label><label>เดือน<input defaultValue={month} name="budgetMonth" required type="month" /></label></div>
          <ModalActions isPending={isPending} onCancel={() => setModal(null)} submitLabel="บันทึกงบ" />
        </form>
      </Modal>

      <Modal isOpen={modal === "repayment"} onClose={() => !isPending && setModal(null)} title="บันทึกการคืนเงิน" description="ใช้เมื่อสมาชิกโอนคืนกันแล้วเพื่อแยกยอดที่ชำระจริงออกจากยอดค้าง">
        <form className={styles.quickForm} onSubmit={(event) => submit(event, createFinanceRepayment, "บันทึกการคืนเงินแล้ว")}>
          <RoomHiddenFields roomCode={roomCode} roomId={roomId} />
          <div className={styles.twoColumns}><label>ผู้คืน<select defaultValue={currentUserId} name="fromUserId">{members.map((member) => <option key={member.userId} value={member.userId}>{member.displayName}</option>)}</select></label><label>คืนให้<select defaultValue={members.find((member) => member.userId !== currentUserId)?.userId} name="toUserId">{members.map((member) => <option key={member.userId} value={member.userId}>{member.displayName}</option>)}</select></label></div>
          <div className={styles.twoColumns}><label>จำนวนเงิน (บาท)<input inputMode="decimal" name="amount" required /></label><label>วันที่คืน<input defaultValue={todayKey()} name="repaidAt" required type="date" /></label></div>
          <ModalActions isPending={isPending} onCancel={() => setModal(null)} submitLabel="บันทึกการคืนเงิน" />
        </form>
      </Modal>
      <Toast message={toast?.message ?? null} onDismiss={() => setToast(null)} tone={toast?.tone} />
    </>
  );
}

function FundCard({ activeFund, funds, onAdd, onContribute, onSelect }: {
  activeFund: FinanceTypeData["funds"][number] | undefined;
  funds: FinanceTypeData["funds"];
  onAdd: () => void;
  onContribute: () => void;
  onSelect: (fundId: string) => void;
}) {
  return (
    <article className={styles.typeCard}>
      <span className={styles.typeCardIcon}><WalletCards aria-hidden size={19} /></span>
      <div><p>กองกลาง</p><strong>{activeFund ? formatBaht(activeFund.contributedCents) : "ยังไม่มีกอง"}</strong></div>
      {funds.length ? <select aria-label="เลือกกองกลาง" onChange={(event) => onSelect(event.target.value)} value={activeFund?.id}>{funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select> : <p className={styles.typeCardDetail}>สร้างกองกลางเพื่อเริ่มสะสมเงินร่วมกัน</p>}
      {activeFund?.targetCents ? <p className={styles.fundProgress}>เป้าหมาย {formatBaht(activeFund.targetCents)}</p> : null}
      <div className={styles.cardActions}><Button onClick={onAdd} type="button"><Plus size={15} /> สร้างกอง</Button>{funds.length ? <Button onClick={onContribute} type="button" variant="primary">เพิ่มเงิน</Button> : null}</div>
    </article>
  );
}

function CategoryCard({ categories, emptyCopy }: { categories: [string, number][]; emptyCopy: string }) {
  return (
    <article className={styles.typeCard}>
      <span className={styles.typeCardIcon}><WalletCards aria-hidden size={19} /></span>
      <div><p>ใช้จ่ายมากที่สุด</p><strong>{categories[0]?.[0] ?? "ยังไม่มีข้อมูล"}</strong></div>
      {categories.length ? <ul className={styles.categoryMiniList}>{categories.slice(0, 3).map(([category, amount]) => <li key={category}><span>{category}</span><strong>{formatBaht(amount)}</strong></li>)}</ul> : <p className={styles.typeCardDetail}>{emptyCopy}</p>}
    </article>
  );
}

function RoomHiddenFields({ roomCode, roomId }: { roomCode: string; roomId: string }) {
  return <><input name="roomId" type="hidden" value={roomId} /><input name="roomCode" type="hidden" value={roomCode} /></>;
}

function ModalActions({ isPending, onCancel, submitLabel }: { isPending: boolean; onCancel: () => void; submitLabel: string }) {
  return <div className={styles.modalActions}><Button disabled={isPending} onClick={onCancel} type="button">ยกเลิก</Button><Button pending={isPending} pendingText="กำลังบันทึก…" variant="primary">{submitLabel}</Button></div>;
}
