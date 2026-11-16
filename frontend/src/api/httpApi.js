// The real backend. Request and response shapes are documented in frontend/API_CONTRACT.md.
import { request, queryString } from "./client.js";

export const httpApi = {
  // Restaurants
  listRestaurants: ({ q, cuisine, sort, page, pageSize } = {}) =>
    request(`/restaurants${queryString({ q, cuisine, sort, page, pageSize })}`),
  listCuisines: () => request("/restaurants/cuisines"),
  getRestaurant: (id) => request(`/restaurants/${encodeURIComponent(id)}`),
  listRestaurantReviews: (id) => request(`/restaurants/${encodeURIComponent(id)}/reviews`),

  // Reviews
  createReview: (restaurantId, { rating, body }) =>
    request(`/restaurants/${encodeURIComponent(restaurantId)}/reviews`, {
      method: "POST",
      body: { rating, body },
      auth: true,
    }),
  updateReview: (reviewId, { rating, body }) =>
    request(`/reviews/${encodeURIComponent(reviewId)}`, { method: "PUT", body: { rating, body }, auth: true }),
  deleteReview: (reviewId) =>
    request(`/reviews/${encodeURIComponent(reviewId)}`, { method: "DELETE", auth: true }),

  // The signed-in user
  getMe: () => request("/me", { auth: true }),
  updateMe: ({ displayName }) => request("/me", { method: "PATCH", body: { displayName }, auth: true }),

  // People
  getUser: (id) => request(`/users/${encodeURIComponent(id)}`),
  listUserReviews: (id) => request(`/users/${encodeURIComponent(id)}/reviews`),
  follow: (id) => request(`/users/${encodeURIComponent(id)}/follow`, { method: "POST", auth: true }),
  unfollow: (id) => request(`/users/${encodeURIComponent(id)}/follow`, { method: "DELETE", auth: true }),
  suggestedUsers: () => request("/users/suggested", { auth: true }),
  getFeed: () => request("/feed", { auth: true }),
};
