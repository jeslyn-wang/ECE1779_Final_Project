import { test } from "node:test";
import assert from "node:assert/strict";
import { tasteMatch } from "../src/lib/tasteMatch.js";

test("identical ratings are a 100% match", () => {
  const a = [{ restaurantId: 1, rating: 5 }, { restaurantId: 2, rating: 3 }];
  assert.deepEqual(tasteMatch(a, a), { score: 100, sharedCount: 2 });
});

test("opposite ratings are a 0% match", () => {
  const a = [{ restaurantId: 1, rating: 5 }];
  const b = [{ restaurantId: 1, rating: 1 }];
  assert.deepEqual(tasteMatch(a, b), { score: 0, sharedCount: 1 });
});

test("only restaurants both people rated are compared", () => {
  const a = [{ restaurantId: 1, rating: 4 }, { restaurantId: 2, rating: 1 }];
  const b = [{ restaurantId: 1, rating: 5 }, { restaurantId: 3, rating: 1 }];
  // one shared restaurant, gap of 1 -> 100 * (1 - 1/4) = 75
  assert.deepEqual(tasteMatch(a, b), { score: 75, sharedCount: 1 });
});

test("no restaurants in common gives null", () => {
  assert.equal(tasteMatch([{ restaurantId: 1, rating: 4 }], [{ restaurantId: 2, rating: 4 }]), null);
  assert.equal(tasteMatch([], []), null);
});
