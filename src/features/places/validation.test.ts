import assert from "node:assert/strict";
import test from "node:test";

import {
  createPlaceSchema,
  deletePlaceSchema,
  updatePlaceSchema,
} from "./validation.ts";

const validPlace = {
  roomId: "11111111-1111-4111-8111-111111111111",
  roomCode: "123456",
  name: "สวนลุมพินี",
  description: "",
  latitude: "13.7307",
  longitude: "100.5418",
  placeDate: "",
};

test("create place trims text and accepts valid latitude longitude", () => {
  const result = createPlaceSchema.safeParse(validPlace);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.description, null);
    assert.equal(result.data.latitude, 13.7307);
    assert.equal(result.data.longitude, 100.5418);
    assert.equal(result.data.placeDate, null);
  }
});
test("create place rejects coordinates outside the real world", () => {
  assert.equal(
    createPlaceSchema.safeParse({
      ...validPlace,
      latitude: "91",
    }).success,
    false,
  );
  assert.equal(
    createPlaceSchema.safeParse({
      ...validPlace,
      longitude: "181",
    }).success,
    false,
  );
});

test("update place schema requires a valid placeId uuid", () => {
  const validUpdate = {
    ...validPlace,
    placeId: "22222222-2222-4222-8222-222222222222",
  };
  const result = updatePlaceSchema.safeParse(validUpdate);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.placeId, "22222222-2222-4222-8222-222222222222");
    assert.equal(result.data.description, null);
  }
});

test("update place schema rejects missing placeId", () => {
  const result = updatePlaceSchema.safeParse(validPlace);
  assert.equal(result.success, false);
});

test("delete place schema accepts valid fields", () => {
  const result = deletePlaceSchema.safeParse({
    placeId: "33333333-3333-4333-8333-333333333333",
    roomId: "11111111-1111-4111-8111-111111111111",
    roomCode: "123456",
  });
  assert.equal(result.success, true);
});

test("delete place schema rejects invalid roomCode", () => {
  const result = deletePlaceSchema.safeParse({
    placeId: "33333333-3333-4333-8333-333333333333",
    roomId: "11111111-1111-4111-8111-111111111111",
    roomCode: "abc",
  });
  assert.equal(result.success, false);
});
