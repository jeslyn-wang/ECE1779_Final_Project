import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { parseId, REVIEW_SELECT, toReview } from "../lib/shapes.js";
import { validateReviewInput } from "../lib/reviewInput.js";

const router = express.Router();

// Editing and deleting both need a signed-in user.
router.use(requireAuth);

// Loads a review and checks the signed-in user wrote it.
// Sends the 404/403 itself and returns null if they can't touch it.
async function findOwnReview(req, res) {
  const id = parseId(req.params.id);
  const result = id === null
    ? { rows: [] }
    : await pool.query(`SELECT id, user_id FROM reviews WHERE id = $1`, [id]);

  const review = result.rows[0];
  if (!review) {
    res.status(404).json({ error: "Review not found." });
    return null;
  }
  if (review.user_id !== req.user.id) {
    res.status(403).json({ error: "You can only change your own reviews." });
    return null;
  }
  return review;
}

// PUT /api/reviews/:id  { rating, body }  -> { review } with updatedAt set
router.put("/:id", async (req, res) => {
  const { value, errors } = validateReviewInput(req.body);
  if (errors) return res.status(400).json({ error: "Please fix the highlighted fields.", errors });

  try {
    const review = await findOwnReview(req, res);
    if (!review) return;

    await pool.query(
      `UPDATE reviews SET rating = $1, body = $2, updated_at = NOW() WHERE id = $3`,
      [value.rating, value.body, review.id]
    );
    const result = await pool.query(`${REVIEW_SELECT} WHERE rv.id = $1`, [review.id]);
    res.json({ review: toReview(result.rows[0]) });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update your review." });
  }
});

// DELETE /api/reviews/:id  -> 204
router.delete("/:id", async (req, res) => {
  try {
    const review = await findOwnReview(req, res);
    if (!review) return;

    await pool.query(`DELETE FROM reviews WHERE id = $1`, [review.id]);
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete your review." });
  }
});

export default router;