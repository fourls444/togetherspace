import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { roomInvites } from "./room-invites";
import { roomMembers } from "./room-members";
import { roomMessages } from "./room-messages";
import { rooms } from "./rooms";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  createdRooms: many(rooms),
  memberships: many(roomMembers),
  createdInvites: many(roomInvites),
  roomMessages: many(roomMessages),
}));
