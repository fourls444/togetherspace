import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const financeTrips = pgTable(
  "finance_trips",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdBy: uuid("created_by").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("finance_trips_name_length", sql`length(btrim(${table.name})) BETWEEN 1 AND 120`),
    check("finance_trips_date_order", sql`${table.endDate} IS NULL OR ${table.startDate} IS NULL OR ${table.endDate} >= ${table.startDate}`),
    index("finance_trips_room_date_idx").on(table.roomId, table.startDate),
  ],
);

export const financeFunds = pgTable(
  "finance_funds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    purpose: text("purpose").notNull(),
    targetCents: integer("target_cents"),
    createdBy: uuid("created_by").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("finance_funds_name_length", sql`length(btrim(${table.name})) BETWEEN 1 AND 120`),
    check("finance_funds_purpose", sql`${table.purpose} IN ('trip', 'date')`),
    check("finance_funds_target_positive", sql`${table.targetCents} IS NULL OR ${table.targetCents} > 0`),
    index("finance_funds_room_created_idx").on(table.roomId, table.createdAt),
  ],
);

export const financeFundContributions = pgTable(
  "finance_fund_contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fundId: uuid("fund_id").notNull().references(() => financeFunds.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    amountCents: integer("amount_cents").notNull(),
    contributionDate: date("contribution_date").defaultNow().notNull(),
    createdBy: uuid("created_by").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("finance_contributions_amount_positive", sql`${table.amountCents} > 0`),
    index("finance_contributions_fund_date_idx").on(table.fundId, table.contributionDate),
  ],
);

export const financeIncomes = pgTable(
  "finance_incomes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    source: text("source").notNull(),
    amountCents: integer("amount_cents").notNull(),
    incomeMonth: date("income_month").notNull(),
    createdBy: uuid("created_by").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("finance_incomes_source_length", sql`length(btrim(${table.source})) BETWEEN 1 AND 120`),
    check("finance_incomes_amount_positive", sql`${table.amountCents} > 0`),
    index("finance_incomes_room_month_idx").on(table.roomId, table.incomeMonth),
  ],
);

export const financeBudgets = pgTable(
  "finance_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    budgetMonth: date("budget_month").notNull(),
    limitCents: integer("limit_cents").notNull(),
    createdBy: uuid("created_by").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("finance_budgets_category_length", sql`length(btrim(${table.category})) BETWEEN 1 AND 80`),
    check("finance_budgets_limit_positive", sql`${table.limitCents} > 0`),
    uniqueIndex("finance_budgets_room_category_month_unique").on(table.roomId, table.category, table.budgetMonth),
    index("finance_budgets_room_month_idx").on(table.roomId, table.budgetMonth),
  ],
);

export const financeRepayments = pgTable(
  "finance_repayments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id").notNull().references(() => profiles.id),
    toUserId: uuid("to_user_id").notNull().references(() => profiles.id),
    amountCents: integer("amount_cents").notNull(),
    repaidAt: date("repaid_at").defaultNow().notNull(),
    createdBy: uuid("created_by").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("finance_repayments_amount_positive", sql`${table.amountCents} > 0`),
    check("finance_repayments_different_members", sql`${table.fromUserId} <> ${table.toUserId}`),
    index("finance_repayments_room_date_idx").on(table.roomId, table.repaidAt),
  ],
);

export const financeExpenses = pgTable(
  "finance_expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amountCents: integer("amount_cents").notNull(),
    expenseDate: date("expense_date").notNull(),
    paidBy: uuid("paid_by").notNull().references(() => profiles.id),
    createdBy: uuid("created_by").notNull().references(() => profiles.id),
    category: text("category").default("อื่นๆ").notNull(),
    tripId: uuid("trip_id").references(() => financeTrips.id, { onDelete: "set null" }),
    fundId: uuid("fund_id").references(() => financeFunds.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("finance_expenses_amount_positive", sql`${table.amountCents} > 0`),
    check("finance_expenses_title_length", sql`length(btrim(${table.title})) BETWEEN 1 AND 120`),
    index("finance_expenses_room_date_idx").on(table.roomId, table.expenseDate),
  ],
);

export const financeExpenseSplits = pgTable(
  "finance_expense_splits",
  {
    expenseId: uuid("expense_id").notNull().references(() => financeExpenses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    amountCents: integer("amount_cents").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.expenseId, table.userId] }),
    check("finance_expense_splits_amount_positive", sql`${table.amountCents} > 0`),
  ],
);

export const financeExpensesRelations = relations(financeExpenses, ({ one, many }) => ({
  room: one(rooms, { fields: [financeExpenses.roomId], references: [rooms.id] }),
  payer: one(profiles, { fields: [financeExpenses.paidBy], references: [profiles.id] }),
  trip: one(financeTrips, { fields: [financeExpenses.tripId], references: [financeTrips.id] }),
  fund: one(financeFunds, { fields: [financeExpenses.fundId], references: [financeFunds.id] }),
  splits: many(financeExpenseSplits),
}));

export const financeExpenseSplitsRelations = relations(financeExpenseSplits, ({ one }) => ({
  expense: one(financeExpenses, { fields: [financeExpenseSplits.expenseId], references: [financeExpenses.id] }),
  member: one(profiles, { fields: [financeExpenseSplits.userId], references: [profiles.id] }),
}));
