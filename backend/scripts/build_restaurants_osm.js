import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const output = path.join(repositoryRoot, "database/restaurant-data-osm.json");

const query = `
[out:json][timeout:180];
area["name"="Toronto"]["boundary"="administrative"]->.searchArea;
(
  nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub)$"]["name"](area.searchArea);
);
out tags center;
`;

const response = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "Accept": "application/json",
    "User-Agent": "ECE1779-Restaurant-Data-Importer/1.0",
  },
  body: new URLSearchParams({ data: query }),
});

if (!response.ok) {
  throw new Error(`OpenStreetMap Overpass request failed: ${response.status} ${await response.text()}`);
}

const osm = await response.json();
const byNameAddress = new Map();

for (const element of osm.elements || []) {
  const tags = element.tags || {};
  const name = tags.name?.trim();
  if (!name) continue;

  const house = tags["addr:housenumber"]?.trim();
  const street = tags["addr:street"]?.trim();
  const suburb = tags["addr:suburb"]?.trim();
  const address = [house, street].filter(Boolean).join(" ");
  const key = `${name.toLowerCase()}|${address.toLowerCase()}|${suburb?.toLowerCase() || ""}`;
  if (byNameAddress.has(key)) continue;

  const cuisineTag = tags.cuisine;
  const cuisine = cuisineTag
    ? cuisineTag.split(";")[0].split("_").map((word) => word ? word[0].toUpperCase() + word.slice(1) : "").join(" ")
    : tags.amenity === "cafe" ? "Cafe" : tags.amenity === "fast_food" ? "Fast Food" : "Restaurant";

  const fullAddress = address
    ? `${address},${suburb ? ` ${suburb},` : ""} Toronto, ON`
    : "Toronto, ON";

  byNameAddress.set(key, {
    name,
    address: fullAddress,
    cuisine,
    neighbourhood: suburb || null,
    priceLevel: null,
    googlePlaceId: null,
    osmType: element.type,
    osmId: element.id,
  });
}

const restaurants = [...byNameAddress.values()]
  .sort((a, b) => a.name.localeCompare(b.name))
  .slice(0, 300);

await fs.writeFile(output, `${JSON.stringify(restaurants, null, 2)}\n`);
console.log(`Wrote ${restaurants.length} OpenStreetMap restaurants to ${output}`);
