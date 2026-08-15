import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const familyTreePeople = pgTable(
  "family_tree_people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    roomMemberUserId: uuid("room_member_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("child"),
    avatarUrl: text("avatar_url"),
    positionX: integer("position_x").default(160).notNull(),
    positionY: integer("position_y").default(120).notNull(),
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
      "family_tree_people_name_length",
      sql`length(btrim(${table.displayName})) BETWEEN 1 AND 80`,
    ),
    check(
      "family_tree_people_role",
      sql`${table.role} IN ('parent', 'child', 'sibling')`,
    ),
    index("family_tree_people_room_idx").on(table.roomId),
    uniqueIndex("family_tree_people_room_member_unique")
      .on(table.roomId, table.roomMemberUserId)
      .where(sql`${table.roomMemberUserId} IS NOT NULL`),
  ],
);

export const familyTreeRelationships = pgTable(
  "family_tree_relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    fromPersonId: uuid("from_person_id")
      .notNull()
      .references(() => familyTreePeople.id, { onDelete: "cascade" }),
    toPersonId: uuid("to_person_id")
      .notNull()
      .references(() => familyTreePeople.id, { onDelete: "cascade" }),
    relationshipType: text("relationship_type").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "family_tree_relationship_type",
      sql`${table.relationshipType} IN ('parent_child', 'sibling')`,
    ),
    check(
      "family_tree_relationship_not_self",
      sql`${table.fromPersonId} <> ${table.toPersonId}`,
    ),
    uniqueIndex("family_tree_relationship_unique").on(
      table.roomId,
      table.fromPersonId,
      table.toPersonId,
      table.relationshipType,
    ),
    index("family_tree_relationship_room_idx").on(table.roomId),
  ],
);

export const familyTreePeopleRelations = relations(
  familyTreePeople,
  ({ one, many }) => ({
    room: one(rooms, {
      fields: [familyTreePeople.roomId],
      references: [rooms.id],
    }),
    linkedProfile: one(profiles, {
      fields: [familyTreePeople.roomMemberUserId],
      references: [profiles.id],
    }),
    parentLinks: many(familyTreeRelationships, {
      relationName: "family_tree_from_person",
    }),
    childLinks: many(familyTreeRelationships, {
      relationName: "family_tree_to_person",
    }),
  }),
);

export const familyTreeRelationshipsRelations = relations(
  familyTreeRelationships,
  ({ one }) => ({
    room: one(rooms, {
      fields: [familyTreeRelationships.roomId],
      references: [rooms.id],
    }),
    fromPerson: one(familyTreePeople, {
      fields: [familyTreeRelationships.fromPersonId],
      references: [familyTreePeople.id],
      relationName: "family_tree_from_person",
    }),
    toPerson: one(familyTreePeople, {
      fields: [familyTreeRelationships.toPersonId],
      references: [familyTreePeople.id],
      relationName: "family_tree_to_person",
    }),
  }),
);
