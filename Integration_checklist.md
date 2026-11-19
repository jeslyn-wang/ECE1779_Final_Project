# Sree integration checklist

This document records standalone analysis and work for the restaurant data and integration portion of the project. 

## Work added

- `database/restaurant-data.json`: 35-record Toronto restaurant starting dataset
- `backend/scripts/import_restaurants.js`: repeatable PostgreSQL importer and optional Google Places enrichment tool
- `database/RESTAURANT_DATA_README.md`: API setup, data-import, rerun, and secret-handling instructions
- `backend/scripts/build_restaurants_osm.js`: repeatable OpenStreetMap Toronto restaurant builder requiring no API key
- `database/restaurant-data-osm.json`: expanded 300-record Toronto dataset from OpenStreetMap
- `database/OSM_DATA_SOURCE.md`: source, method, limitations, verification needs, and import instructions

## API fields to preserve

The frontend contract expects:

- `id`
- `name`
- `cuisine`
- `address`
- `neighbourhood`
- `priceLevel`
- `imageUrl`
- `avgRating`
- `reviewCount`

`googlePlaceId` should be stored as a database-only deduplication key and does not need to be returned by normal list endpoints.

## Import verification checklist

- Count duplicate Google Place IDs
- Count records missing addresses
- Count records missing cuisine labels
- Verify price levels are integers from 1–4
- Confirm rerunning the importer does not create duplicate records
- Compare imported records with the API contract after the backend is updated

## Project integration gap observed

The current mock API and React UI support the complete product experience, but the real Express routes only implement health and restaurant reads. Sree's data work should not be treated as complete integration until Joshi exposes the missing contract endpoints and Wasilat switches the deployed frontend from mock mode to the real HTTP API.
