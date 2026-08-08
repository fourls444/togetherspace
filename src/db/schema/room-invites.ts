import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const roomInvites = pgTable(
  "room_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    inviteCode: text("invite_code").notNull().unique(),
    inviteToken: text("invite_token").notNull().unique(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxUses: integer("max_uses"),
    usesCount: integer("uses_count").notNull().default(0),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("room_invites_max_uses_positive", sql`${table.maxUses} > 0`),
    check("room_invites_uses_count_nonnegative", sql`${table.usesCount} >= 0`),
    check(
      "room_invites_uses_within_limit",
      sql`${table.maxUses} is null or ${table.usesCount} <= ${table.maxUses}`,
    ),
  ],
);

export const roomInvitesRelations = relations(roomInvites, ({ one }) => ({
  room: one(rooms, {
    fields: [roomInvites.roomId],
    references: [rooms.id],
  }),
  creator: one(profiles, {
    fields: [roomInvites.createdBy],
    references: [profiles.id],
  }),
}));
