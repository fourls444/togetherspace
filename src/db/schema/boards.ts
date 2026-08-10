import { relations, sql } from "drizzle-orm";
import {
  check,
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const boardTypeEnum = pgEnum("board_type", [
  "main",
  "notes",
  "checklist",
  "poll",
  "custom",
]);

export const boardItemTypeEnum = pgEnum("board_item_type", [
  "note",
  "checklist",
  "poll",
]);

export const boards = pgTable("boards", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("บอร์ดหลัก"),
  boardType: boardTypeEnum("board_type").notNull().default("main"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const boardItems = pgTable(
  "board_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    itemType: boardItemTypeEnum("item_type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    positionX: integer("position_x").notNull().default(0),
    positionY: integer("position_y").notNull().default(0),
    width: integer("width").notNull().default(320),
    height: integer("height").notNull().default(180),
    zIndex: integer("z_index").notNull().default(0),
    color: text("color"),
    pollMaxVotesPerUser: integer("poll_max_votes_per_user")
      .notNull()
      .default(1),
    pollAllowVoteCancel: boolean("poll_allow_vote_cancel")
      .notNull()
      .default(true),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    check("board_items_width_positive", sql`${table.width} > 0`),
    check("board_items_height_positive", sql`${table.height} > 0`),
    check(
      "board_items_poll_max_votes_positive",
      sql`${table.pollMaxVotesPerUser} > 0`,
    ),
  ],
);

export const boardChecklistItems = pgTable(
  "board_checklist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boardItemId: uuid("board_item_id")
      .notNull()
      .references(() => boardItems.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isDone: boolean("is_done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const boardPollOptions = pgTable("board_poll_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  boardItemId: uuid("board_item_id")
    .notNull()
    .references(() => boardItems.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const boardPollVotes = pgTable(
  "board_poll_votes",
  {
    optionId: uuid("option_id")
      .notNull()
      .references(() => boardPollOptions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "board_poll_votes_pkey",
      columns: [table.optionId, table.userId],
    }),
  ],
);

export const boardsRelations = relations(boards, ({ one, many }) => ({
  room: one(rooms, {
    fields: [boards.roomId],
    references: [rooms.id],
  }),
  creator: one(profiles, {
    fields: [boards.createdBy],
    references: [profiles.id],
  }),
  items: many(boardItems),
}));

export const boardItemsRelations = relations(boardItems, ({ one, many }) => ({
  board: one(boards, {
    fields: [boardItems.boardId],
    references: [boards.id],
  }),
  creator: one(profiles, {
    fields: [boardItems.createdBy],
    references: [profiles.id],
  }),
  checklistItems: many(boardChecklistItems),
  pollOptions: many(boardPollOptions),
}));

export const boardChecklistItemsRelations = relations(
  boardChecklistItems,
  ({ one }) => ({
    boardItem: one(boardItems, {
      fields: [boardChecklistItems.boardItemId],
      references: [boardItems.id],
    }),
  }),
);

export const boardPollOptionsRelations = relations(
  boardPollOptions,
  ({ one, many }) => ({
    boardItem: one(boardItems, {
      fields: [boardPollOptions.boardItemId],
      references: [boardItems.id],
    }),
    votes: many(boardPollVotes),
  }),
);

export const boardPollVotesRelations = relations(boardPollVotes, ({ one }) => ({
  option: one(boardPollOptions, {
    fields: [boardPollVotes.optionId],
    references: [boardPollOptions.id],
  }),
  user: one(profiles, {
    fields: [boardPollVotes.userId],
    references: [profiles.id],
  }),
}));
