import express from "express";
import { pool } from "../db.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { parseId, REVIEW_SELECT, toReview } from "../lib/shapes.js";
import { tasteMatch } from "../lib/tasteMatch.js";

const router = express.Router();

// Every user's ratings as { restaurantId, rating }, for taste match.
async function ratingsOf(userId) {
  const result = await pool.query(
    `SELECT restaurant_id, rating FROM reviews WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map((row) => ({ restaurantId: row.restaurant_id, rating: Number(row.rating) }));
}

// Builds the contract's Profile for userId, as seen by viewer (req.user, or null when signed out).
// Returns null if the user doesn't exist.
async function loadProfile(userId, viewer, viewerRatings) {
  const result = await pool.query(
    `
    SELECT
      u.id, u.display_name, u.created_at,
      (SELECT COUNT(*)::INTEGER FROM reviews WHERE user_id = u.id) AS review_count,
      (SELECT COUNT(*)::INTEGER FROM follows WHERE followed_id = u.id) AS follower_count,
      (SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = u.id) AS following_count,
      EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND followed_id = u.id) AS is_following
    FROM users u
    WHERE u.id = $1
    `,
    [userId, viewer ? viewer.id : null]
  );
  const row = result.rows[0];
  if (!row) return null;

  const isMe = viewer ? viewer.id === row.id : false;
  const showViewerFields = viewer && !isMe; // null when signed out or looking at yourself

  return {
    id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    reviewCount: row.review_count,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    isMe,
    isFollowing: showViewerFields ? row.is_following : null,
    tasteMatch: showViewerFields
      ? tasteMatch(viewerRatings ?? (await ratingsOf(viewer.id)), await ratingsOf(row.id))
      : null,
  };
}

// GET /api/users/suggested  🔒  (registered before /:id so "suggested" isn't read as an id)
// Up to 5 people you don't follow yet who have a taste match with you, best match first.
router.get("/suggested", requireAuth, async (req, res) => {
  try {
    const candidates = await pool.query(
      `
      SELECT DISTINCT other.user_id AS id
      FROM reviews mine
      JOIN reviews other ON other.restaurant_id = mine.restaurant_id
      WHERE mine.user_id = $1
        AND other.user_id <> $1
        AND NOT EXISTS (
          SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = other.user_id
        )
      `,
      [req.user.id]
    );

    const myRatings = await ratingsOf(req.user.id);
    const profiles = await Promise.all(
      candidates.rows.map((row) => loadProfile(row.id, req.user, myRatings))
    );

    const users = profiles
      .filter((profile) => profile && profile.tasteMatch)
      .sort(
        (a, b) =>
          b.tasteMatch.score - a.tasteMatch.score ||
          b.tasteMatch.sharedCount - a.tasteMatch.sharedCount
      )
      .slice(0, 5);

    res.json({ users });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    res.status(500).json({ error: "Failed to load suggestions." });
  }
});

// GET /api/users/:id  -> { user: Profile }  (public; personalised when signed in)
router.get("/:id", optionalAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found." });

  try {
    const user = await loadProfile(id, req.user);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to load this profile." });
  }
});

// GET /api/users/:id/reviews  -> newest first
router.get("/:id/reviews", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found." });

  try {
    const exists = await pool.query(`SELECT 1 FROM users WHERE id = $1`, [id]);
    if (exists.rows.length === 0) return res.status(404).json({ error: "User not found." });

    const result = await pool.query(
      `${REVIEW_SELECT} WHERE rv.user_id = $1 ORDER BY rv.created_at DESC, rv.id DESC`,
      [id]
    );
    res.json({ reviews: result.rows.map(toReview) });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to load reviews." });
  }
});

// POST /api/users/:id/follow  🔒  -> 204 (following twice is fine)
router.post("/:id/follow", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found." });
  if (id === req.user.id) return res.status(400).json({ error: "You can't follow yourself." });

  try {
    await pool.query(
      `INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.id, id]
    );
    res.status(204).end();
  } catch (error) {
    if (error.code === "23503") return res.status(404).json({ error: "User not found." });
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow." });
  }
});

// DELETE /api/users/:id/follow  🔒  -> 204 (unfollowing someone you don't follow is fine)
router.delete("/:id/follow", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found." });

  try {
    await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2`,
      [req.user.id, id]
    );
    res.status(204).end();
  } catch (error) {
    if (error.code === "23503") return res.status(404).json({ error: "User not found." });
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow." });
  }
});

export default router;