import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const roomPlaces = pgTable(
  "room_places",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    placeDate: date("place_date"),
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
    index("room_places_room_created_idx").on(table.roomId, table.createdAt),
    check(
      "room_places_name_length",
      sql`length(btrim(${table.name})) BETWEEN 1 AND 120`,
    ),
    check(
      "room_places_description_length",
      sql`${table.description} IS NULL OR length(btrim(${table.description})) <= 1000`,
    ),
    check(
      "room_places_latitude_range",
      sql`${table.latitude} BETWEEN -90 AND 90`,
    ),
    check(
      "room_places_longitude_range",
      sql`${table.longitude} BETWEEN -180 AND 180`,
    ),
  ],
);

export const roomPlacesRelations = relations(roomPlaces, ({ one }) => ({
  room: one(rooms, {
    fields: [roomPlaces.roomId],
    references: [rooms.id],
  }),
  creator: one(profiles, {
    fields: [roomPlaces.createdBy],
    references: [profiles.id],
  }),
}));
