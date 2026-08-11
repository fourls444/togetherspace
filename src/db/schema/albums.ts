import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const albumPhotos = pgTable(
  "album_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => profiles.id),
    imageUrl: text("image_url").notNull(),
    storagePath: text("storage_path").notNull(),
    caption: text("caption"),
    takenAt: date("taken_at").notNull().default(sql`CURRENT_DATE`),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("album_photos_room_sort_idx").on(
      table.roomId,
      table.takenAt,
      table.sortOrder,
      table.createdAt,
    ),
    check(
      "album_photos_caption_length",
      sql`${table.caption} IS NULL OR length(btrim(${table.caption})) <= 280`,
    ),
    check("album_photos_sort_order_positive", sql`${table.sortOrder} >= 0`),
  ],
);

export const albumPhotosRelations = relations(albumPhotos, ({ one }) => ({
  room: one(rooms, {
    fields: [albumPhotos.roomId],
    references: [rooms.id],
  }),
  uploader: one(profiles, {
    fields: [albumPhotos.uploadedBy],
    references: [profiles.id],
  }),
}));
