export type FinanceSplit = {
  userId: string;
  amountCents: number;
};

export type FinanceExpenseForSummary = {
  amountCents: number;
  paidBy: string;
  splits: FinanceSplit[];
};

export type FinanceSettlement = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
};

export type FinanceRepaymentForSummary = {
  amountCents: number;
  fromUserId: string;
  toUserId: string;
};

/** คำนวณยอดสุทธิหลังหักยอดที่คืนแล้ว และยุบเป็นรายการจ่ายคืนที่สั้นที่สุดแบบ greedy */
export function calculateFinanceSummary(
  expenses: FinanceExpenseForSummary[],
  repayments: FinanceRepaymentForSummary[] = [],
) {
  const balances = new Map<string, number>();
  let totalCents = 0;

  for (const expense of expenses) {
    totalCents += expense.amountCents;
    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) ?? 0) + expense.amountCents,
    );

    for (const split of expense.splits) {
      balances.set(
        split.userId,
        (balances.get(split.userId) ?? 0) - split.amountCents,
      );
    }
  }

  for (const repayment of repayments) {
    balances.set(
      repayment.fromUserId,
      (balances.get(repayment.fromUserId) ?? 0) + repayment.amountCents,
    );
    balances.set(
      repayment.toUserId,
      (balances.get(repayment.toUserId) ?? 0) - repayment.amountCents,
    );
  }

  const creditors = [...balances.entries()]
    .filter(([, balance]) => balance > 0)
    .map(([userId, amountCents]) => ({ userId, amountCents }));
  const debtors = [...balances.entries()]
    .filter(([, balance]) => balance < 0)
    .map(([userId, balance]) => ({ userId, amountCents: -balance }));
  const settlements: FinanceSettlement[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amountCents = Math.min(creditor.amountCents, debtor.amountCents);

    settlements.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents,
    });
    creditor.amountCents -= amountCents;
    debtor.amountCents -= amountCents;

    if (creditor.amountCents === 0) creditorIndex += 1;
    if (debtor.amountCents === 0) debtorIndex += 1;
  }

  return { balances, settlements, totalCents };
}

/** แสดงจำนวนสตางค์เป็นเงินบาทโดยใช้รูปแบบภาษาไทย */
export function formatBaht(amountCents: number): string {
  return `${new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)} บาท`;
}
