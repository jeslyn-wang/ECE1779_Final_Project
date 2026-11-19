
import express from "express";
import { pool } from "./db.js";
import restaurantsRouter from "./routes/restaurants.js";
import meRouter from "./routes/me.js";
import reviewsRouter from "./routes/reviews.js";

const app = express();

app.use(express.json());

// Keep API endpoints under /api so the ingress and local NGINX proxy agree.
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      service: "backend",
      database: "connected"
    });
  } catch (error) {
    console.error("Health check database query failed:", error.message);
    res.status(503).json({
      status: "error",
      service: "backend",
      database: "unavailable"
    });
  }
});

// Feature routes
app.use("/api/restaurants", restaurantsRouter);
app.use("/api/me", meRouter);
app.use("/api/reviews", reviewsRouter);

// Return 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});

// Anything a route didn't catch: log it, return a generic 500
app.use((error, _req, res, _next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Something went wrong on our side." });
});

export default app;
