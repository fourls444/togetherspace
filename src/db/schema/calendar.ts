import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    eventDate: date("event_date").notNull(),
    color: text("color").notNull().default("#E8A055"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "calendar_events_title_length",
      sql`length(btrim(${table.title})) BETWEEN 1 AND 120`,
    ),
    check(
      "calendar_events_color_hex",
      sql`${table.color} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
  ],
);

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  room: one(rooms, {
    fields: [calendarEvents.roomId],
    references: [rooms.id],
  }),
  creator: one(profiles, {
    fields: [calendarEvents.createdBy],
    references: [profiles.id],
  }),
}));
