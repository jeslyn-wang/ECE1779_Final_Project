
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/restaurants
// Supports search, cuisine filtering, sorting, and pagination.
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      cuisine,
      sort = "name",
      page = "1",
      pageSize = "20",
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (currentPage - 1) * limit;

    const conditions = [];
    const values = [];

    if (q) {
      values.push(`%${q}%`);
      conditions.push(
        `(r.name ILIKE $${values.length} OR r.address ILIKE $${values.length})`
      );
    }

    if (cuisine) {
      values.push(cuisine);
      conditions.push(`r.cuisine = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Only allow known sort options.
    const sortOptions = {
      name: "r.name ASC",
      newest: "r.created_at DESC",
      rating: "average_rating DESC NULLS LAST",
    };

    const orderBy = sortOptions[sort] || sortOptions.name;

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.name,
        r.address,
        r.cuisine,
        COALESCE(AVG(rv.rating), 0) AS average_rating,
        COUNT(rv.id)::INTEGER AS review_count
      FROM restaurants r
      LEFT JOIN reviews rv ON rv.restaurant_id = r.id
      ${whereClause}
      GROUP BY r.id
      ORDER BY ${orderBy}
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
      `,
      [...values, limit, offset]
    );

    res.json({
      restaurants: result.rows,
      page: currentPage,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants." });
  }
});

// GET /api/restaurants/cuisines
router.get("/cuisines", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT cuisine
      FROM restaurants
      WHERE cuisine IS NOT NULL
      ORDER BY cuisine ASC
    `);

    res.json({
      cuisines: result.rows.map((row) => row.cuisine),
    });
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    res.status(500).json({ error: "Failed to fetch cuisines." });
  }
});

// GET /api/restaurants/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.name,
        r.address,
        r.cuisine,
        COALESCE(AVG(rv.rating), 0) AS average_rating,
        COUNT(rv.id)::INTEGER AS review_count
      FROM restaurants r
      LEFT JOIN reviews rv ON rv.restaurant_id = r.id
      WHERE r.id = $1
      GROUP BY r.id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    res.json({ restaurant: result.rows[0] });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ error: "Failed to fetch restaurant." });
  }
});

export default router;
