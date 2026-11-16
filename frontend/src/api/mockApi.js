// In-browser stand-in for the backend, used by `npm run dev:mock`.
// It returns exactly the shapes in API_CONTRACT.md, so pages behave the same
// against the real API. Data is kept in localStorage so it survives reloads.
import { ApiError } from "./client.js";
import { seedFollows, seedRestaurants, seedReviews, seedUsers } from "./mockData.js";
import { tasteMatch } from "../lib/tasteMatch.js";

const DB_KEY = "forkful-mock-db-v1";
const SESSION_KEY = "forkful-mock-session";
const DAY = 24 * 60 * 60 * 1000;

function freshDb() {
  const now = Date.now();
  return {
    users: seedUsers.map((u) => ({ ...u, createdAt: new Date(now - 400 * DAY).toISOString() })),
    reviews: seedReviews.map(([userId, restaurantId, rating, body, daysAgo], i) => ({
      id: i + 1,
      userId,
      restaurantId,
      rating,
      body,
      createdAt: new Date(now - daysAgo * DAY).toISOString(),
    })),
    follows: seedFollows.map(([followerId, followedId]) => ({ followerId, followedId })),
    nextUserId: 100,
    nextReviewId: 1000,
  };
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode). Mock data then lasts until reload.
  }
}

let db = (() => {
  try {
    const saved = JSON.parse(read(DB_KEY));
    if (saved?.users && saved?.reviews && saved?.follows) return saved;
  } catch {
    // fall through to fresh data
  }
  return freshDb();
})();

const save = () => write(DB_KEY, JSON.stringify(db));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const respond = async (value) => {
  await sleep(150 + Math.random() * 200); // feel like a network call
  return structuredClone(value);
};

// ---- session -------------------------------------------------------------

// Kept in memory too, so signing in still works when localStorage is blocked.
let memorySession = read(SESSION_KEY);

function setSession(id) {
  memorySession = id === null ? null : String(id);
  write(SESSION_KEY, memorySession);
}

function sessionUserId() {
  const id = Number(memorySession);
  return db.users.some((u) => u.id === id) ? id : null;
}

function requireUser() {
  const id = sessionUserId();
  if (!id) throw new ApiError("Please log in to continue.", 401);
  return id;
}

export const mockAuth = {
  hasSession: () => sessionUserId() !== null,
  async signIn(email, password) {
    await sleep(250);
    const user = db.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new ApiError("Email or password is incorrect.", 401);
    }
    setSession(user.id);
  },
  async signUp(displayName, email, password) {
    await sleep(250);
    const normalized = email.trim().toLowerCase();
    if (db.users.some((u) => u.email === normalized)) {
      throw new ApiError("An account with this email already exists.", 409, {
        email: "An account with this email already exists.",
      });
    }
    const user = {
      id: db.nextUserId++,
      displayName: displayName.trim(),
      email: normalized,
      password,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    save();
    setSession(user.id);
  },
  async signOut() {
    setSession(null);
  },
  resetDemoData() {
    db = freshDb();
    save();
    setSession(null);
  },
};

// ---- shaping helpers ---------------------------------------------------------

const userById = (id) => db.users.find((u) => u.id === id);
const restaurantById = (id) => seedRestaurants.find((r) => r.id === id);

function ratingStats(restaurantId) {
  const ratings = db.reviews.filter((r) => r.restaurantId === restaurantId).map((r) => r.rating);
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => (ratingCounts[Math.round(r)] += 1));
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  return {
    avgRating: avg === null ? null : Math.round(avg * 10) / 10,
    reviewCount: ratings.length,
    ratingCounts,
  };
}

function restaurantOut(r, { withCounts = false } = {}) {
  const { ratingCounts, ...stats } = ratingStats(r.id);
  return { imageUrl: null, ...r, ...stats, ...(withCounts ? { ratingCounts } : {}) };
}

function reviewOut(review) {
  const user = userById(review.userId);
  const restaurant = restaurantById(review.restaurantId);
  return {
    id: review.id,
    rating: review.rating,
    body: review.body,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt ?? null,
    user: { id: user.id, displayName: user.displayName },
    restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine },
  };
}

const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

function ratingsOf(userId) {
  return db.reviews.filter((r) => r.userId === userId).map((r) => ({ restaurantId: r.restaurantId, rating: r.rating }));
}

function userOut(user, viewerId) {
  const isMe = viewerId === user.id;
  return {
    id: user.id,
    displayName: user.displayName,
    createdAt: user.createdAt,
    reviewCount: db.reviews.filter((r) => r.userId === user.id).length,
    followerCount: db.follows.filter((f) => f.followedId === user.id).length,
    followingCount: db.follows.filter((f) => f.followerId === user.id).length,
    isMe,
    isFollowing:
      viewerId && !isMe ? db.follows.some((f) => f.followerId === viewerId && f.followedId === user.id) : null,
    tasteMatch: viewerId && !isMe ? tasteMatch(ratingsOf(viewerId), ratingsOf(user.id)) : null,
  };
}

function validateReview({ rating, body }) {
  const errors = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Choose a rating from 1 to 5 stars.";
  if (typeof body !== "string" || body.length > 2000) errors.body = "Keep your review under 2000 characters.";
  if (Object.keys(errors).length) throw new ApiError("Please fix the highlighted fields.", 400, errors);
  return { rating, body: body.trim() };
}

function findUser(id) {
  const user = userById(Number(id));
  if (!user) throw new ApiError("We couldn't find that person.", 404);
  return user;
}

function findRestaurant(id) {
  const restaurant = restaurantById(Number(id));
  if (!restaurant) throw new ApiError("We couldn't find that restaurant.", 404);
  return restaurant;
}

function ownReview(reviewId) {
  const userId = requireUser();
  const review = db.reviews.find((r) => r.id === Number(reviewId));
  if (!review) throw new ApiError("We couldn't find that review.", 404);
  if (review.userId !== userId) throw new ApiError("You can only change your own reviews.", 403);
  return review;
}

// ---- the API ---------------------------------------------------------------

export const mockApi = {
  async listRestaurants({ q = "", cuisine = "", sort = "rating", page = 1, pageSize = 12 } = {}) {
    const term = q.trim().toLowerCase();
    let list = seedRestaurants
      .filter((r) => !cuisine || r.cuisine === cuisine)
      .filter(
        (r) =>
          !term ||
          [r.name, r.cuisine, r.neighbourhood, r.address].some((field) => field.toLowerCase().includes(term))
      )
      .map((r) => restaurantOut(r));

    const byName = (a, b) => a.name.localeCompare(b.name);
    if (sort === "name") list.sort(byName);
    else if (sort === "reviews") list.sort((a, b) => b.reviewCount - a.reviewCount || byName(a, b));
    else list.sort((a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1) || b.reviewCount - a.reviewCount || byName(a, b));

    const size = Math.min(Math.max(Number(pageSize) || 12, 1), 50);
    const current = Math.max(Number(page) || 1, 1);
    return respond({
      restaurants: list.slice((current - 1) * size, current * size),
      total: list.length,
      page: current,
      pageSize: size,
    });
  },

  async listCuisines() {
    return respond({ cuisines: [...new Set(seedRestaurants.map((r) => r.cuisine))].sort() });
  },

  async getRestaurant(id) {
    return respond({ restaurant: restaurantOut(findRestaurant(id), { withCounts: true }) });
  },

  async listRestaurantReviews(id) {
    const restaurant = findRestaurant(id);
    const reviews = db.reviews.filter((r) => r.restaurantId === restaurant.id).sort(newestFirst);
    return respond({ reviews: reviews.map(reviewOut) });
  },

  async createReview(restaurantId, input) {
    const userId = requireUser();
    const restaurant = findRestaurant(restaurantId);
    const { rating, body } = validateReview(input);
    if (db.reviews.some((r) => r.userId === userId && r.restaurantId === restaurant.id)) {
      throw new ApiError("You've already reviewed this restaurant. Edit your review instead.", 409);
    }
    const review = {
      id: db.nextReviewId++,
      userId,
      restaurantId: restaurant.id,
      rating,
      body,
      createdAt: new Date().toISOString(),
    };
    db.reviews.push(review);
    save();
    return respond({ review: reviewOut(review) });
  },

  async updateReview(reviewId, input) {
    const review = ownReview(reviewId);
    Object.assign(review, validateReview(input), { updatedAt: new Date().toISOString() });
    save();
    return respond({ review: reviewOut(review) });
  },

  async deleteReview(reviewId) {
    const review = ownReview(reviewId);
    db.reviews = db.reviews.filter((r) => r !== review);
    save();
    await sleep(150);
    return null;
  },

  async getMe() {
    const user = userById(requireUser());
    return respond({ user: { id: user.id, displayName: user.displayName, email: user.email } });
  },

  async updateMe({ displayName }) {
    const user = userById(requireUser());
    const name = typeof displayName === "string" ? displayName.trim() : "";
    if (name.length < 2 || name.length > 50) {
      throw new ApiError("Please fix the highlighted fields.", 400, {
        displayName: "Use 2 to 50 characters.",
      });
    }
    user.displayName = name;
    save();
    return respond({ user: { id: user.id, displayName: user.displayName, email: user.email } });
  },

  async getUser(id) {
    return respond({ user: userOut(findUser(id), sessionUserId()) });
  },

  async listUserReviews(id) {
    const user = findUser(id);
    const reviews = db.reviews.filter((r) => r.userId === user.id).sort(newestFirst);
    return respond({ reviews: reviews.map(reviewOut) });
  },

  async follow(id) {
    const me = requireUser();
    const target = findUser(id);
    if (target.id === me) throw new ApiError("You can't follow yourself.", 400);
    if (!db.follows.some((f) => f.followerId === me && f.followedId === target.id)) {
      db.follows.push({ followerId: me, followedId: target.id });
      save();
    }
    await sleep(150);
    return null;
  },

  async unfollow(id) {
    const me = requireUser();
    const target = findUser(id);
    db.follows = db.follows.filter((f) => !(f.followerId === me && f.followedId === target.id));
    save();
    await sleep(150);
    return null;
  },

  async suggestedUsers() {
    const me = requireUser();
    const following = new Set(db.follows.filter((f) => f.followerId === me).map((f) => f.followedId));
    const users = db.users
      .filter((u) => u.id !== me && !following.has(u.id))
      .map((u) => userOut(u, me))
      .filter((u) => u.tasteMatch)
      .sort((a, b) => b.tasteMatch.score - a.tasteMatch.score || b.tasteMatch.sharedCount - a.tasteMatch.sharedCount)
      .slice(0, 5);
    return respond({ users });
  },

  async getFeed() {
    const me = requireUser();
    const following = new Set(db.follows.filter((f) => f.followerId === me).map((f) => f.followedId));
    const reviews = db.reviews.filter((r) => following.has(r.userId)).sort(newestFirst).slice(0, 50);
    return respond({ reviews: reviews.map(reviewOut) });
  },
};
