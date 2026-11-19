import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const defaultJson = path.join(repositoryRoot, "database/restaurant-data.json");

async function googlePlaces() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("Set GOOGLE_PLACES_API_KEY before running --google.");

  const input = path.resolve(argument("--file", defaultJson));
  const output = path.resolve(argument("--output", path.join(repositoryRoot, "database/restaurant-data-places.json")));
  const restaurants = JSON.parse(await fs.readFile(input, "utf8"));
  const enriched = [];

  for (const restaurant of restaurants) {
    const query = `${restaurant.name}, ${restaurant.address}`;
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.primaryType,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Google Places lookup failed for ${restaurant.name}: ${response.status} ${detail}`);
    }

    const data = await response.json();
    const place = data.places?.[0];
    enriched.push(place ? {
      name: place.displayName?.text || restaurant.name,
      address: place.formattedAddress || restaurant.address,
      cuisine: place.primaryTypeDisplayName?.text || restaurant.cuisine,
      neighbourhood: restaurant.neighbourhood || null,
      priceLevel: place.priceLevel ? { FREE: 0, INEXPENSIVE: 1, MODERATE: 2, EXPENSIVE: 3, VERY_EXPENSIVE: 4 }[place.priceLevel] ?? null : restaurant.priceLevel ?? null,
      googlePlaceId: place.id,
    } : restaurant);

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(enriched, null, 2)}\n`);
  console.log(`Wrote ${enriched.length} restaurants to ${output}`);
}

async function importDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Set DATABASE_URL before running --import.");

  const input = path.resolve(argument("--file", defaultJson));
  const restaurants = JSON.parse(await fs.readFile(input, "utf8"));
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const columns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'restaurants'
    `);
    const available = new Set(columns.rows.map((row) => row.column_name));

    let inserted = 0;
    let updated = 0;

    for (const restaurant of restaurants) {
      const googlePlaceId = restaurant.googlePlaceId?.trim() || null;
      let existing;

      if (googlePlaceId && available.has("google_place_id")) {
        existing = await pool.query("SELECT id FROM restaurants WHERE google_place_id = $1", [googlePlaceId]);
      } else {
        existing = await pool.query(
          "SELECT id FROM restaurants WHERE lower(name) = lower($1) AND COALESCE(lower(address), '') = lower(COALESCE($2, ''))",
          [restaurant.name, restaurant.address]
        );
      }

      const fields = {
        name: restaurant.name,
        address: restaurant.address || null,
        cuisine: restaurant.cuisine || null,
      };
      if (available.has("neighbourhood")) fields.neighbourhood = restaurant.neighbourhood || null;
      if (available.has("price_level")) fields.price_level = restaurant.priceLevel ?? null;
      if (available.has("google_place_id")) fields.google_place_id = googlePlaceId;
      if (available.has("image_url") && restaurant.imageUrl) fields.image_url = restaurant.imageUrl;

      const entries = Object.entries(fields);
      if (existing.rows.length) {
        const assignments = entries.map(([key], index) => `${key} = $${index + 2}`).join(", ");
        await pool.query(
          `UPDATE restaurants SET ${assignments} WHERE id = $1`,
          [existing.rows[0].id, ...entries.map(([, value]) => value)]
        );
        updated += 1;
      } else {
        const names = entries.map(([key]) => key).join(", ");
        const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
        await pool.query(
          `INSERT INTO restaurants (${names}) VALUES (${placeholders})`,
          entries.map(([, value]) => value)
        );
        inserted += 1;
      }
    }

    console.log(`Restaurant import complete: ${inserted} inserted, ${updated} updated.`);
  } finally {
    await pool.end();
  }
}

if (process.argv.includes("--google")) {
  googlePlaces().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
} else if (process.argv.includes("--import")) {
  importDatabase().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
} else {
  console.log("Usage:\n  node scripts/import_restaurants.js --google [--file ...] [--output ...]\n  DATABASE_URL=... node scripts/import_restaurants.js --import [--file ...]");
}
