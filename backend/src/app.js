import express from "express";
import { pool } from "./db.js";

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

// TODO: Mount feature routes here, e.g. restaurants, reviews, users, follows.

app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

export default app;
