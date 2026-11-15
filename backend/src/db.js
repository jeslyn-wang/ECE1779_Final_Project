import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // In production, configure SSL only if your database deployment requires it.
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});
