# API contract (frontend ⇄ backend)

This is what the React frontend calls and expects back. The mock in `src/api/mockApi.js` returns exactly these shapes, so anything that works in `npm run dev:mock` should work against the real backend once these endpoints exist.

**Conventions**

- Everything is under `/api` and uses JSON. Field names are camelCase.
- **Auth:** when someone is signed in, every request carries `Authorization: Bearer <Firebase ID token>`. Verify it with the Firebase Admin SDK. Endpoints marked 🔒 require it (return 401 without it). Public endpoints still receive the token when available and use it to fill in `isFollowing` and `tasteMatch`.
- **Errors:** `{ "error": "Message shown to the user" }`, plus optional `"errors": { "field": "message" }` for form validation (400). Use 401 (not signed in), 403 (not yours), 404 (not found), 409 (conflict).
- **Route order:** register `/restaurants/cuisines` before `/restaurants/:id`, and `/users/suggested` before `/users/:id`.
- IDs may be numbers or strings; the frontend treats them as opaque.

## Shared shapes

```jsonc
// Restaurant (lists)
{ "id": 1, "name": "Kumo Ramen", "cuisine": "Japanese", "address": "Augusta Ave, Toronto",
  "neighbourhood": "Kensington Market",  // optional, null if unknown
  "priceLevel": 2,                       // optional, 1-4 or null (Google Places price_level)
  "imageUrl": null,                      // optional
  "avgRating": 4.3,                      // 1 decimal, null when no reviews
  "reviewCount": 12 }

// Review (always includes both user and restaurant summaries)
{ "id": 7, "rating": 4, "body": "Rich broth…", "createdAt": "2026-11-14T18:02:00Z", "updatedAt": null,
  "user": { "id": 2, "displayName": "Marcus Lee" },
  "restaurant": { "id": 3, "name": "Kumo Ramen", "cuisine": "Japanese" } }

// Profile
{ "id": 2, "displayName": "Marcus Lee", "createdAt": "…",
  "reviewCount": 5, "followerCount": 2, "followingCount": 1,
  "isMe": false,
  "isFollowing": true,                          // null when signed out or isMe
  "tasteMatch": { "score": 88, "sharedCount": 3 } }  // null when signed out, isMe, or nothing in common
```

## Endpoints

| Method & path | Auth | Request | Response |
| --- | --- | --- | --- |
| `GET /restaurants?q=&cuisine=&sort=&page=&pageSize=` | | `q` searches name, cuisine, neighbourhood, address (case-insensitive). `cuisine` exact match. `sort`: `rating` (default; nulls last), `reviews`, `name`. `page` 1-based, `pageSize` default 12, max 50 | `{ restaurants: Restaurant[], total, page, pageSize }` |
| `GET /restaurants/cuisines` | | | `{ cuisines: string[] }` sorted A-Z |
| `GET /restaurants/:id` | | | `{ restaurant: Restaurant & { ratingCounts: { "1": n, …, "5": n } } }` |
| `GET /restaurants/:id/reviews` | | | `{ reviews: Review[] }` newest first |
| `POST /restaurants/:id/reviews` | 🔒 | `{ rating: 1-5 integer, body: string ≤ 2000 (may be "") }` | 201 `{ review }`. 409 if this user already reviewed it |
| `PUT /reviews/:id` | 🔒 | same as POST | `{ review }` with `updatedAt` set. 403 if not the author |
| `DELETE /reviews/:id` | 🔒 | | 204. 403 if not the author |
| `GET /me` | 🔒 | | `{ user: { id, displayName, email } }`. **Creates the users row on first call** from the token (`uid`, `name` or the email prefix) |
| `PATCH /me` | 🔒 | `{ displayName: 2-50 chars }` | `{ user }` |
| `GET /users/:id` | | | `{ user: Profile }` |
| `GET /users/:id/reviews` | | | `{ reviews: Review[] }` newest first |
| `POST /users/:id/follow` | 🔒 | | 204 (idempotent). 400 if following yourself |
| `DELETE /users/:id/follow` | 🔒 | | 204 (idempotent) |
| `GET /users/suggested` | 🔒 | | `{ users: Profile[] }`: up to 5 people you don't follow yet, with a non-null `tasteMatch`, best match first |
| `GET /feed` | 🔒 | | `{ reviews: Review[] }`: latest 50 reviews by people you follow, newest first |

## Taste match

For two people A and B, take the restaurants both have reviewed. Ratings are 1-5, so the largest possible gap is 4:

```
score = round(100 * (1 - average(|ratingA - ratingB|) / 4))
```

Identical ratings give 100, opposite ratings give 0, and no shared restaurants gives `null`. Return `{ score, sharedCount }`. The frontend's version is `src/lib/tasteMatch.js` (with tests) if you want to match it exactly.

## Suggested schema tweaks

Against `database/001_initial_schema.sql`:

- `reviews`: add `UNIQUE (user_id, restaurant_id)` (one review per person per restaurant), an `updated_at TIMESTAMPTZ`, and tighten the rating check to whole stars 1-5 (`rating SMALLINT CHECK (rating BETWEEN 1 AND 5)`), or keep `NUMERIC` if we want half stars later.
- `users`: add `email TEXT`.
- `restaurants`: optional `neighbourhood TEXT`, `price_level SMALLINT`, `image_url TEXT`, and a `google_place_id TEXT UNIQUE` so re-running the Places import doesn't create duplicates.
