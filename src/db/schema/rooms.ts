import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { roomInvites } from "./room-invites";
import { roomMembers } from "./room-members";

export const roomTypeEnum = pgEnum("room_type", [
  "friend",
  "couple",
  "family",
]);

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  roomCode: text("room_code").notNull().unique(),
  type: roomTypeEnum("type").notNull(),
  avatarUrl: text("avatar_url"),
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

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [rooms.createdBy],
    references: [profiles.id],
  }),
  members: many(roomMembers),
  invites: many(roomInvites),
}));
