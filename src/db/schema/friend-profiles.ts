import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const friendProfiles = pgTable(
  "friend_profiles",
  {
    roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    bio: text("bio"),
    facebookUrl: text("facebook_url"),
    lineId: text("line_id"),
    instagramUrl: text("instagram_url"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ name: "friend_profiles_pk", columns: [table.roomId, table.userId] })],
);
