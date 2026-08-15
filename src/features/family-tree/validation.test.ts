import assert from "node:assert/strict";
import test from "node:test";

import {
  createFamilyTreeRelationshipSchema,
  upsertFamilyTreePersonSchema,
} from "./validation.ts";

test("ตรวจข้อมูลคนในผังและแปลงค่าว่างเป็น null", () => {
  const result = upsertFamilyTreePersonSchema.parse({
    avatarUrl: "",
    displayName: "แม่",
    personId: "",
    positionX: "120",
    positionY: "80",
    role: "parent",
    roomCode: "123456",
    roomId: "11111111-1111-4111-8111-111111111111",
    roomMemberUserId: "",
  });

  assert.equal(result.avatarUrl, null);
  assert.equal(result.personId, null);
  assert.equal(result.positionX, 120);
});

test("ไม่ให้โยงความสัมพันธ์กับคนเดิม", () => {
  const result = createFamilyTreeRelationshipSchema.safeParse({
    fromPersonId: "22222222-2222-4222-8222-222222222222",
    relationshipType: "sibling",
    roomCode: "123456",
    roomId: "11111111-1111-4111-8111-111111111111",
    toPersonId: "22222222-2222-4222-8222-222222222222",
  });

  assert.equal(result.success, false);
});
