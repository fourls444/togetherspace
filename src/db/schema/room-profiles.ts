import {
  foreignKey,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { roomMembers } from "./room-members";

export const roomProfiles = pgTable(
  "room_profiles",
  {
    roomId: uuid("room_id").notNull(),
    userId: uuid("user_id").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "room_profiles_pk",
      columns: [table.roomId, table.userId],
    }),
    foreignKey({
      name: "room_profiles_member_fk",
      columns: [table.roomId, table.userId],
      foreignColumns: [roomMembers.roomId, roomMembers.userId],
    }).onDelete("cascade"),
  ],
);
