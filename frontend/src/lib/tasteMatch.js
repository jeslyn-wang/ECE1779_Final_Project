// "Taste match": how closely two people rate the restaurants they've both reviewed.
// The backend should use the same formula (see API_CONTRACT.md) so the numbers agree.
//
// For each shared restaurant, ratings are 1-5, so the biggest possible gap is 4.
// score = 100 * (1 - averageGap / 4), rounded. Identical ratings -> 100, opposite -> 0.
// Returns null when there's nothing in common to compare.

export function tasteMatch(ratingsA, ratingsB) {
  const byRestaurant = new Map(ratingsA.map((r) => [r.restaurantId, r.rating]));
  const gaps = ratingsB
    .filter((r) => byRestaurant.has(r.restaurantId))
    .map((r) => Math.abs(byRestaurant.get(r.restaurantId) - r.rating));

  if (!gaps.length) return null;
  const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  return { score: Math.round(100 * (1 - averageGap / 4)), sharedCount: gaps.length };
}
