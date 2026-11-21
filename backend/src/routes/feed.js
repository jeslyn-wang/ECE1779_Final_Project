import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { REVIEW_SELECT, toReview } from "../lib/shapes.js";

const router = express.Router();

// GET /api/feed  🔒  -> latest 50 reviews by people you follow, newest first
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      ${REVIEW_SELECT}
      WHERE rv.user_id IN (SELECT followed_id FROM follows WHERE follower_id = $1)
      ORDER BY rv.created_at DESC, rv.id DESC
      LIMIT 50
      `,
      [req.user.id]
    );
    res.json({ reviews: result.rows.map(toReview) });
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ error: "Failed to load your feed." });
  }
});

export default router;