import pg from "pg";

const { Pool, types } = pg;

// Return BIGINT columns (ids, COUNT(*)) as JS numbers instead of strings.
// Safe here: our ids and counts are far below Number.MAX_SAFE_INTEGER.
types.setTypeParser(types.builtins.INT8, (value) => parseInt(value, 10));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // In production, configure SSL only if your database deployment requires it.
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});
