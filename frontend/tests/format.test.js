import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRating, initials, plural, priceLabel, timeAgo, tileColour } from "../src/lib/format.js";

test("formatRating shows one decimal, or a dash when there are no ratings", () => {
  assert.equal(formatRating(4), "4.0");
  assert.equal(formatRating(4.25), "4.3");
  assert.equal(formatRating(null), "–");
});

test("timeAgo reads naturally", () => {
  const now = Date.parse("2026-11-15T12:00:00Z");
  assert.equal(timeAgo("2026-11-15T11:59:30Z", now), "just now");
  assert.equal(timeAgo("2026-11-15T09:00:00Z", now), "3 hours ago");
  assert.equal(timeAgo("2026-11-14T12:00:00Z", now), "yesterday");
  assert.match(timeAgo("2026-08-01T12:00:00Z", now), /2026/);
});

test("small helpers", () => {
  assert.equal(plural(1, "review"), "1 review");
  assert.equal(plural(3, "review"), "3 reviews");
  assert.equal(priceLabel(3), "$$$");
  assert.equal(priceLabel(null), "");
  assert.equal(initials("Priya  Shah"), "PS");
  assert.equal(tileColour("Thai"), tileColour("Thai"));
});
