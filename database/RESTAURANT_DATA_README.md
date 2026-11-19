# Toronto restaurant data

This directory contains standalone work for Sree's restaurant-data responsibility. These files do not modify the application's existing schemas or startup scripts.

## Current data file

`restaurant-data.json` contains 35 Toronto restaurant records for the initial dataset. It includes the proposed fields:

- name
- address
- cuisine
- neighbourhood
- price level (1–4)
- Google Place ID, initially blank

The list is a starting dataset, not a claim of completeness or live Google verification.

## Google Places enrichment

The importer can use Google Places API (New) Text Search to replace/verify record details and add a unique `googlePlaceId`.

From the repository root:

```bash
cd backend
GOOGLE_PLACES_API_KEY="your-key-here" node scripts/import_restaurants.js --google
```

By default, the script writes `database/restaurant-data-places.json`. This mode:

- does not write to PostgreSQL
- does not print the API key
- uses one request per restaurant
- honours the Google Places API's returned place ID, address, cuisine type, and price level

Optional paths:

```bash
GOOGLE_PLACES_API_KEY="your-key-here" node scripts/import_restaurants.js --google --file ../database/restaurant-data.json --output ../database/restaurant-data-places.json
```

Google Places API credentials should be stored in a local environment variable or a Kubernetes/GitHub secret. Do not commit the key.

## PostgreSQL import

The importer can be run against a running PostgreSQL database:

```bash
cd backend
DATABASE_URL="postgres://restaurant_user:change_me_locally@localhost:5432/restaurant_app" node scripts/import_restaurants.js --import --file ../database/restaurant-data-places.json
```

The script:

- detects the restaurant table columns that already exist
- inserts missing records
- updates matching records
- matches on Google Place ID when available
- falls back to name and address for records without a Place ID
- only writes the optional fields that exist in the current schema

It is safe to rerun; it performs upserts rather than blindly duplicating restaurants.

## Recommended next integration step

Coordinate with Joshi before applying this script to production. The script currently matches the proposed `neighbourhood`, `price_level`, `google_place_id`, and `image_url` schema fields only when those columns are present. The team should merge the suggested schema changes and restaurant endpoints before final deployment.
