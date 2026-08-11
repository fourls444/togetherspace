import assert from "node:assert/strict";
import test from "node:test";

import { createPlaceSchema } from "./validation.ts";

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
