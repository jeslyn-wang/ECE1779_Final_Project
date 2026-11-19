// Checks the body of POST /api/restaurants/:id/reviews and PUT /api/reviews/:id.
// Contract: { rating: whole number 1-5, body: string up to 2000 characters (may be "") }.
// Returns { value } when valid, or { errors } keyed by field for the frontend form.
export function validateReviewInput(input = {}) {
  const errors = {};
  const { rating } = input;
  const body = input.body ?? "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Pick a rating from 1 to 5 stars.";
  }
  if (typeof body !== "string") {
    errors.body = "Review text must be text.";
  } else if (body.length > 2000) {
    errors.body = "Keep your review under 2000 characters.";
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { value: { rating, body: body.trim() } };
}