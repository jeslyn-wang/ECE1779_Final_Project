import express from "express";
import { pool } from "../db.js";
import { parseId, RESTAURANT_COLUMNS, toRestaurant, REVIEW_SELECT, toReview } from "../lib/shapes.js";

const router = express.Router();

// GET /api/restaurants?q=&cuisine=&sort=&page=&pageSize=
// q searches name, cuisine, neighbourhood and address. sort: rating (default), reviews, name.
router.get("/", async (req, res) => {
  try {
    const { q = "", cuisine, sort = "rating", page = "1", pageSize = "12" } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 12));
    const offset = (currentPage - 1) * limit;

    const conditions = [];
    const values = [];

    if (q.trim()) {
      values.push(`%${q.trim()}%`);
      const p = `$${values.length}`;
      conditions.push(
        `(r.name ILIKE ${p} OR r.cuisine ILIKE ${p} OR r.neighbourhood ILIKE ${p} OR r.address ILIKE ${p})`
      );
    }

    if (cuisine) {
      values.push(cuisine);
      conditions.push(`r.cuisine = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Only allow known sort options (never put user input straight into ORDER BY).
    const sortOptions = {
      rating: "avg_rating DESC NULLS LAST, review_count DESC, r.name ASC",
      reviews: "review_count DESC, r.name ASC",
      name: "r.name ASC",
    };
    const orderBy = sortOptions[sort] || sortOptions.rating;

    const [rows, count] = await Promise.all([
      pool.query(
        `
        SELECT ${RESTAURANT_COLUMNS}
        FROM restaurants r
        LEFT JOIN reviews rv ON rv.restaurant_id = r.id
        ${whereClause}
        GROUP BY r.id
        ORDER BY ${orderBy}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `,
        [...values, limit, offset]
      ),
      pool.query(`SELECT COUNT(*)::INTEGER AS total FROM restaurants r ${whereClause}`, values),
    ]);

    res.json({
      restaurants: rows.rows.map(toRestaurant),
      total: count.rows[0].total,
      page: currentPage,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Failed to fetch restaurants." });
  }
});

// GET /api/restaurants/cuisines  (registered before /:id so "cuisines" isn't read as an id)
router.get("/cuisines", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT cuisine
      FROM restaurants
      WHERE cuisine IS NOT NULL
      ORDER BY cuisine ASC
    `);
    res.json({ cuisines: result.rows.map((row) => row.cuisine) });
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    res.status(500).json({ error: "Failed to fetch cuisines." });
  }
});

// GET /api/restaurants/:id  -> restaurant plus how many reviews gave each star rating
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Restaurant not found." });

  try {
    const result = await pool.query(
      `
      SELECT ${RESTAURANT_COLUMNS},
        COUNT(*) FILTER (WHERE ROUND(rv.rating) = 1)::INTEGER AS stars_1,
        COUNT(*) FILTER (WHERE ROUND(rv.rating) = 2)::INTEGER AS stars_2,
        COUNT(*) FILTER (WHERE ROUND(rv.rating) = 3)::INTEGER AS stars_3,
        COUNT(*) FILTER (WHERE ROUND(rv.rating) = 4)::INTEGER AS stars_4,
        COUNT(*) FILTER (WHERE ROUND(rv.rating) = 5)::INTEGER AS stars_5
      FROM restaurants r
      LEFT JOIN reviews rv ON rv.restaurant_id = r.id
      WHERE r.id = $1
      GROUP BY r.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    const row = result.rows[0];
    res.json({
      restaurant: {
        ...toRestaurant(row),
        ratingCounts: {
          1: row.stars_1, 2: row.stars_2, 3: row.stars_3, 4: row.stars_4, 5: row.stars_5,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ error: "Failed to fetch restaurant." });
  }
});

// GET /api/restaurants/:id/reviews  -> newest first
router.get("/:id/reviews", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Restaurant not found." });

  try {
    const exists = await pool.query(`SELECT 1 FROM restaurants WHERE id = $1`, [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    const result = await pool.query(
      `${REVIEW_SELECT} WHERE rv.restaurant_id = $1 ORDER BY rv.created_at DESC, rv.id DESC`,
      [id]
    );
    res.json({ reviews: result.rows.map(toReview) });
  } catch (error) {
    console.error("Error fetching restaurant reviews:", error);
    res.status(500).json({ error: "Failed to fetch restaurant reviews." });
  }
});

export default router;