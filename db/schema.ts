import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roomTypeEnum = pgEnum("room_type", ["friend", "couple", "family"]);

export const roomRoleEnum = pgEnum("room_role", ["owner", "member"]);

// Profile ใช้ id เดียวกับ Supabase Auth user และเก็บข้อมูลที่แอปแสดงผล
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

// ห้องเก็บข้อมูลหลัก ส่วนสิทธิ์ของสมาชิกแยกอยู่ใน room_members
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
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

export const roomMembers = pgTable(
  "room_members",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: roomRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
  },
  // สมาชิกหนึ่งคนมีได้เพียงหนึ่งบทบาทต่อหนึ่งห้อง
  (table) => [
    primaryKey({
      name: "room_members_pkey",
      columns: [table.roomId, table.userId],
    }),
  ],
);

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
  // จำกัดจำนวนครั้งของ invite และป้องกันตัวนับติดลบหรือเกินเพดาน
  (table) => [
    check("room_invites_max_uses_positive", sql`${table.maxUses} > 0`),
    check("room_invites_uses_count_nonnegative", sql`${table.usesCount} >= 0`),
    check(
      "room_invites_uses_within_limit",
      sql`${table.maxUses} is null or ${table.usesCount} <= ${table.maxUses}`,
    ),
  ],
);

// ความสัมพันธ์ด้าน Profile สำหรับดึงห้อง สมาชิก และ invite ที่ผู้ใช้สร้าง
export const profilesRelations = relations(profiles, ({ many }) => ({
  createdRooms: many(rooms),
  memberships: many(roomMembers),
  createdInvites: many(roomInvites),
}));

// ความสัมพันธ์ด้านห้องสำหรับดึงผู้สร้าง สมาชิก และ invites
export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [rooms.createdBy],
    references: [profiles.id],
  }),
  members: many(roomMembers),
  invites: many(roomInvites),
}));

// เชื่อม membership กลับไปยังห้องและ Profile ของสมาชิก
export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  profile: one(profiles, {
    fields: [roomMembers.userId],
    references: [profiles.id],
  }),
}));

// เชื่อม invite กลับไปยังห้องและ Profile ของผู้สร้าง
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
