
BEGIN;

-- ==========================================
-- USERS
-- ==========================================

INSERT INTO users (id, firebase_uid, display_name)
VALUES
    (9001, 'mock-alice', 'Alice Chen'),
    (9002, 'mock-ben', 'Ben Wilson'),
    (9003, 'mock-chloe', 'Chloe Zhang'),
    (9004, 'mock-daniel', 'Daniel Kim'),
    (9005, 'mock-emily', 'Emily Wang'),
    (9006, 'mock-james', 'James Lee'),
    (9007, 'mock-sarah', 'Sarah Patel'),
    (9008, 'mock-olivia', 'Olivia Brown')
ON CONFLICT (id) DO UPDATE SET
    firebase_uid = EXCLUDED.firebase_uid,
    display_name = EXCLUDED.display_name;


-- ==========================================
-- RESTAURANTS
-- ==========================================

INSERT INTO restaurants (id, name, address, cuisine)
VALUES
    (9001, 'Kinton Ramen', '402 Queen St W, Toronto, ON', 'Japanese'),
    (9002, 'Miku Toronto', '10 Bay St, Toronto, ON', 'Japanese'),
    (9003, 'Pai Northern Thai Kitchen', '18 Duncan St, Toronto, ON', 'Thai'),
    (9004, 'Daldongnae Korean BBQ', '602 Bloor St W, Toronto, ON', 'Korean'),
    (9005, 'Richmond Station', '1 Richmond St W, Toronto, ON', 'Canadian'),
    (9006, 'Sugo', '1281 Bloor St W, Toronto, ON', 'Italian'),
    (9007, 'Seven Lives Tacos', '72 Kensington Ave, Toronto, ON', 'Mexican'),
    (9008, 'Ramen Isshin', '421 College St, Toronto, ON', 'Japanese'),
    (9009, 'Gusto 101', '101 Portland St, Toronto, ON', 'Italian'),
    (9010, 'Banh Mi Boys', '392 Queen St W, Toronto, ON', 'Vietnamese'),
    (9011, 'House of Gourmet', '484 Dundas St W, Toronto, ON', 'Chinese'),
    (9012, 'Mildred''s Temple Kitchen', '85 Hanna Ave, Toronto, ON', 'Brunch'),
    (9013, 'Chubby''s Jamaican Kitchen', '104 Portland St, Toronto, ON', 'Caribbean'),
    (9014, 'Khao San Road', '11 Charlotte St, Toronto, ON', 'Thai'),
    (9015, 'Cafe Landwer', '165 University Ave, Toronto, ON', 'Mediterranean')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    cuisine = EXCLUDED.cuisine;


-- ==========================================
-- REVIEWS
-- ==========================================

INSERT INTO reviews (id, user_id, restaurant_id, rating, body)
VALUES
    (9001, 9001, 9001, 5.0, 'Rich and flavourful broth. One of my favourite ramen spots.'),
    (9002, 9001, 9003, 4.5, 'Amazing Thai food with generous portions.'),
    (9003, 9001, 9007, 4.0, 'Great tacos and a fun atmosphere.'),
    (9004, 9002, 9002, 5.0, 'Excellent sushi and beautiful presentation.'),
    (9005, 9002, 9005, 4.5, 'Great service and creative dishes.'),
    (9006, 9002, 9010, 4.0, 'Really good sandwiches for a quick lunch.'),
    (9007, 9003, 9004, 5.0, 'Delicious Korean BBQ. Great for sharing.'),
    (9008, 9003, 9008, 4.5, 'Excellent ramen with lots of flavour.'),
    (9009, 9003, 9011, 4.0, 'Good portions and reasonable prices.'),
    (9010, 9004, 9006, 5.0, 'Fantastic pasta and tomato sauce.'),
    (9011, 9004, 9009, 4.5, 'Great Italian food and atmosphere.'),
    (9012, 9004, 9012, 5.0, 'Perfect brunch spot for a weekend.'),
    (9013, 9005, 9001, 4.0, 'Good ramen, although the wait was a little long.'),
    (9014, 9005, 9003, 5.0, 'Loved the flavours and spice levels.'),
    (9015, 9005, 9014, 4.5, 'Authentic and delicious Thai food.'),
    (9016, 9006, 9007, 5.0, 'Some of the best tacos in the city.'),
    (9017, 9006, 9013, 4.5, 'Great Caribbean flavours.'),
    (9018, 9006, 9010, 4.0, 'Tasty and convenient lunch option.'),
    (9019, 9007, 9012, 5.0, 'Wonderful brunch and atmosphere.'),
    (9020, 9007, 9015, 4.0, 'Nice cafe with plenty of options.'),
    (9021, 9007, 9005, 4.5, 'A little pricey but worth trying.'),
    (9022, 9008, 9002, 5.0, 'Amazing sushi experience.'),
    (9023, 9008, 9008, 4.5, 'Great noodles and rich broth.'),
    (9024, 9008, 9011, 4.0, 'Solid Chinese food with large portions.')
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    restaurant_id = EXCLUDED.restaurant_id,
    rating = EXCLUDED.rating,
    body = EXCLUDED.body;


-- ==========================================
-- FOLLOWS
-- ==========================================

INSERT INTO follows (follower_id, followed_id)
VALUES
    (9001, 9002),
    (9001, 9003),
    (9001, 9005),
    (9002, 9001),
    (9002, 9004),
    (9002, 9006),
    (9003, 9005),
    (9003, 9006),
    (9004, 9001),
    (9004, 9007),
    (9005, 9002),
    (9005, 9008),
    (9006, 9001),
    (9007, 9003),
    (9008, 9005)
ON CONFLICT (follower_id, followed_id) DO NOTHING;


-- ==========================================
-- RESET GENERATED ID SEQUENCES
-- ==========================================

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    (SELECT MAX(id) FROM users),
    true
);

SELECT setval(
    pg_get_serial_sequence('restaurants', 'id'),
    (SELECT MAX(id) FROM restaurants),
    true
);

SELECT setval(
    pg_get_serial_sequence('reviews', 'id'),
    (SELECT MAX(id) FROM reviews),
    true
);

COMMIT;
