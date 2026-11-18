-- Schema updates requested in frontend/API_CONTRACT.md ("Suggested schema tweaks").
-- Runs after 001_initial_schema.sql and before seed.sql (files run in alphabetical order).
-- Safe to run more than once, so teammates with an existing database volume can apply it by hand.

-- users: store the email from the Firebase token (returned by GET /api/me)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- restaurants: optional details shown by the frontend and filled in by the Google Places import
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS neighbourhood TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_level SMALLINT CHECK (price_level BETWEEN 1 AND 4);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;

-- reviews: track edits (PUT /api/reviews/:id sets this)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- reviews: one review per person per restaurant (POST returns 409 on a second one)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_restaurant_unique') THEN
        ALTER TABLE reviews
            ADD CONSTRAINT reviews_user_restaurant_unique UNIQUE (user_id, restaurant_id);
    END IF;
END $$;

-- reviews: ratings are 1-5. Kept as NUMERIC so the seed data's half stars (4.5) still load;
-- the API itself only accepts whole stars, as the frontend sends.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);

-- Indexes for the queries the API runs most (reviews by restaurant/user, feed, followers)
CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON reviews (restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_created_at_idx ON reviews (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_followed_id_idx ON follows (followed_id);