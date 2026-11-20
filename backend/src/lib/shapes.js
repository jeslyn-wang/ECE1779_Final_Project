// Turns database rows into the JSON shapes in frontend/API_CONTRACT.md,
// so every route returns restaurants and reviews the same way (camelCase).

// Route IDs must be whole numbers; anything else is treated as "not found".
export function parseId(value) {
  return /^\d+$/.test(String(value)) ? Number(value) : null;
}

// Columns for a restaurant plus its rating summary.
// Use with: FROM restaurants r LEFT JOIN reviews rv ON rv.restaurant_id = r.id ... GROUP BY r.id
export const RESTAURANT_COLUMNS = `
  r.id, r.name, r.cuisine, r.address, r.neighbourhood, r.price_level, r.image_url,
  ROUND(AVG(rv.rating), 1) AS avg_rating,
  COUNT(rv.id)::INTEGER AS review_count
`;

export function toRestaurant(row) {
  return {
    id: row.id,
    name: row.name,
    cuisine: row.cuisine,
    address: row.address,
    neighbourhood: row.neighbourhood,
    priceLevel: row.price_level,
    imageUrl: row.image_url,
    avgRating: row.avg_rating === null ? null : Number(row.avg_rating), // null when no reviews
    reviewCount: row.review_count,
  };
}

// A review with its author and restaurant. Add WHERE / ORDER BY after it.
export const REVIEW_SELECT = `
  SELECT
    rv.id, rv.rating, rv.body, rv.created_at, rv.updated_at,
    u.id AS user_id, u.display_name AS user_display_name,
    r.id AS restaurant_id, r.name AS restaurant_name, r.cuisine AS restaurant_cuisine
  FROM reviews rv
  JOIN users u ON u.id = rv.user_id
  JOIN restaurants r ON r.id = rv.restaurant_id
`;

export function toReview(row) {
  return {
    id: row.id,
    rating: Number(row.rating),
    body: row.body ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: { id: row.user_id, displayName: row.user_display_name },
    restaurant: { id: row.restaurant_id, name: row.restaurant_name, cuisine: row.restaurant_cuisine },
  };
}