import { z } from "zod";

export const familyTreeRoleSchema = z.enum(["parent", "child", "sibling"]);
export const familyTreeRelationshipTypeSchema = z.enum([
  "parent_child",
  "sibling",
]);

const roomScopeSchema = z.object({
  roomId: z.string().uuid(),
  roomCode: z.string().regex(/^\d{6}$/),
});

const nullableUuidSchema = z
  .union([z.string().uuid(), z.literal("")])
  .transform((value) => (value ? value : null));

const optionalAvatarSchema = z
  .string()
  .trim()
  .max(1000)
  .transform((value) => (value ? value : null));

export const upsertFamilyTreePersonSchema = roomScopeSchema
  .extend({
    personId: nullableUuidSchema,
    roomMemberUserId: nullableUuidSchema,
    displayName: z
      .string()
      .trim()
      .min(1, "กรุณากรอกชื่อคนในผัง")
      .max(80, "ชื่อในผังยาวเกินไป"),
    role: familyTreeRoleSchema,
    avatarUrl: optionalAvatarSchema,
    positionX: z.coerce.number().int().min(0).max(3000).default(160),
    positionY: z.coerce.number().int().min(0).max(2000).default(120),
  })
  .transform((value) => ({
    ...value,
    avatarUrl: value.avatarUrl || null,
  }));

export const moveFamilyTreePersonSchema = roomScopeSchema.extend({
  personId: z.string().uuid(),
  positionX: z.coerce.number().int().min(0).max(3000),
  positionY: z.coerce.number().int().min(0).max(2000),
});

export const deleteFamilyTreePersonSchema = roomScopeSchema.extend({
  personId: z.string().uuid(),
});

export const createFamilyTreeRelationshipSchema = roomScopeSchema
  .extend({
    fromPersonId: z.string().uuid(),
    toPersonId: z.string().uuid(),
    relationshipType: familyTreeRelationshipTypeSchema,
  })
  .refine((value) => value.fromPersonId !== value.toPersonId, {
    message: "เลือกคนสองคนที่ไม่ซ้ำกัน",
    path: ["toPersonId"],
  });

export const deleteFamilyTreeRelationshipSchema = roomScopeSchema.extend({
  relationshipId: z.string().uuid(),
});

export type UpsertFamilyTreePersonInput = z.infer<
  typeof upsertFamilyTreePersonSchema
>;
