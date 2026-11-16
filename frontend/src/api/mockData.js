// Demo data for mock mode only. Restaurants and people are fictional.
// Real restaurants will come from the database (seeded from Google Places).

export const seedUsers = [
  { id: 1, displayName: "Priya Shah", email: "priya@example.com", password: "password1" },
  { id: 2, displayName: "Marcus Lee", email: "marcus@example.com", password: "password1" },
  { id: 3, displayName: "Sofia Romano", email: "sofia@example.com", password: "password1" },
  { id: 4, displayName: "Daniel Okafor", email: "daniel@example.com", password: "password1" },
  { id: 5, displayName: "Mei Chen", email: "mei@example.com", password: "password1" },
  { id: 6, displayName: "Alex Tremblay", email: "alex@example.com", password: "password1" },
];

export const seedRestaurants = [
  { id: 1, name: "Little Saffron", cuisine: "Indian", neighbourhood: "Leslieville", address: "Queen St E, Toronto", priceLevel: 2 },
  { id: 2, name: "Nonna's Table", cuisine: "Italian", neighbourhood: "Little Italy", address: "College St, Toronto", priceLevel: 3 },
  { id: 3, name: "Kumo Ramen", cuisine: "Japanese", neighbourhood: "Kensington Market", address: "Augusta Ave, Toronto", priceLevel: 2 },
  { id: 4, name: "Green Basil", cuisine: "Thai", neighbourhood: "The Annex", address: "Bloor St W, Toronto", priceLevel: 2 },
  { id: 5, name: "Harbour Grill", cuisine: "Seafood", neighbourhood: "Harbourfront", address: "Queens Quay W, Toronto", priceLevel: 4 },
  { id: 6, name: "Casa Verde", cuisine: "Mexican", neighbourhood: "Ossington", address: "Ossington Ave, Toronto", priceLevel: 2 },
  { id: 7, name: "Golden Dumpling House", cuisine: "Chinese", neighbourhood: "Chinatown", address: "Spadina Ave, Toronto", priceLevel: 1 },
  { id: 8, name: "Pho Lucky", cuisine: "Vietnamese", neighbourhood: "Riverdale", address: "Gerrard St E, Toronto", priceLevel: 1 },
  { id: 9, name: "The Maple Diner", cuisine: "Breakfast", neighbourhood: "The Junction", address: "Dundas St W, Toronto", priceLevel: 2 },
  { id: 10, name: "Seoul Kitchen", cuisine: "Korean", neighbourhood: "Koreatown", address: "Bloor St W, Toronto", priceLevel: 2 },
  { id: 11, name: "Olive & Fig", cuisine: "Mediterranean", neighbourhood: "Greektown", address: "Danforth Ave, Toronto", priceLevel: 3 },
  { id: 12, name: "Smoke & Barrel", cuisine: "BBQ", neighbourhood: "Liberty Village", address: "Liberty St, Toronto", priceLevel: 3 },
  { id: 13, name: "Jollof Spot", cuisine: "West African", neighbourhood: "Weston", address: "Weston Rd, Toronto", priceLevel: 1 },
  { id: 14, name: "Bread & Butter", cuisine: "Bakery", neighbourhood: "Roncesvalles", address: "Roncesvalles Ave, Toronto", priceLevel: 1 },
  { id: 15, name: "Spice Route", cuisine: "Ethiopian", neighbourhood: "Danforth East", address: "Danforth Ave, Toronto", priceLevel: 2 },
  { id: 16, name: "Sakura Sushi Bar", cuisine: "Japanese", neighbourhood: "Yorkville", address: "Cumberland St, Toronto", priceLevel: 4 },
];

// [userId, restaurantId, rating, body, daysAgo]
export const seedReviews = [
  [1, 1, 5, "The butter chicken is the best I've had in the city. Get the garlic naan.", 3],
  [1, 3, 4, "Rich tonkotsu broth, noodles had a great bite. Line moves fast.", 12],
  [1, 7, 5, "Pork and chive dumplings, every time. Cash only, worth it.", 20],
  [1, 10, 4, "Bibimbap in the stone bowl is excellent. A bit loud on weekends.", 33],
  [1, 15, 5, "Shared the veggie combo with friends and we cleaned the injera.", 41],
  [2, 3, 5, "Spicy miso ramen is perfect on a cold night.", 2],
  [2, 7, 4, "Fast, cheap and tasty. The soup dumplings are the move.", 9],
  [2, 12, 5, "Brisket was smoky and tender. Mac and cheese is a must.", 15],
  [2, 16, 3, "Fish was fresh but very pricey for the portion.", 28],
  [2, 10, 5, "Korean fried chicken with extra sauce. Incredible.", 50],
  [3, 2, 5, "Feels like eating at my grandmother's. Cacio e pepe is perfect.", 1],
  [3, 11, 4, "Lovely mezze platter, friendly staff, great patio.", 7],
  [3, 5, 4, "Great view and the halibut was cooked perfectly.", 18],
  [3, 14, 5, "Almond croissants sell out by 10am. Go early.", 25],
  [3, 6, 3, "Tacos were good but the salsa lacked heat.", 37],
  [4, 13, 5, "Smoky party jollof and the suya is unreal.", 4],
  [4, 15, 4, "Generous portions and the coffee ceremony is a treat.", 11],
  [4, 1, 4, "Solid curries. The lamb rogan josh was the standout.", 22],
  [4, 12, 4, "Pulled pork sandwich hit the spot.", 30],
  [4, 9, 3, "Classic diner breakfast, nothing special but reliable.", 44],
  [5, 7, 5, "My go-to for dumplings. The chili oil is homemade.", 5],
  [5, 3, 4, "Good ramen, slightly salty broth this time.", 14],
  [5, 8, 5, "Rare beef pho with a huge bowl of herbs. Perfect hangover cure.", 19],
  [5, 16, 4, "Omakase was beautiful. Special occasion spot.", 26],
  [5, 10, 4, "Tteokbokki has a real kick. Cozy space.", 35],
  [6, 9, 5, "Pancakes the size of your head. Weekend brunch staple.", 6],
  [6, 14, 4, "Great sourdough and the coffee is strong.", 13],
  [6, 2, 4, "Fresh pasta, warm service. Booking recommended.", 21],
  [6, 6, 4, "Al pastor tacos were excellent. Good margaritas.", 29],
  [6, 11, 5, "Grilled octopus was the best dish I ate this year.", 38],
];

// [followerId, followedId]
export const seedFollows = [
  [1, 2],
  [1, 5],
  [2, 1],
  [3, 6],
  [4, 1],
  [5, 2],
  [6, 3],
];
