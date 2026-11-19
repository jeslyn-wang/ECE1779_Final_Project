import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Every /api/me route needs a signed-in user.
router.use(requireAuth);

// GET /api/me
// The signed-in user's own profile. The users row is created on first call (in requireAuth).
router.get("/", (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/me  { displayName: 2-50 chars }
router.patch("/", async (req, res) => {
  const displayName =
    typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";

  if (displayName.length < 2 || displayName.length > 50) {
    return res.status(400).json({
      error: "Please fix the highlighted fields.",
      errors: { displayName: "Name must be 2-50 characters." },
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, display_name, email`,
      [displayName, req.user.id]
    );
    const row = result.rows[0];
    res.json({ user: { id: row.id, displayName: row.display_name, email: row.email } });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update your profile." });
  }
});

export default router;