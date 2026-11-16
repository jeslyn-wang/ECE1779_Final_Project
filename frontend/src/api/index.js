// Picks the API implementation once, at build time.
//   npm run dev        -> real backend (via the /api proxy)
//   npm run dev:mock   -> in-browser demo data, no backend or Firebase needed
import { httpApi } from "./httpApi.js";
import { mockApi } from "./mockApi.js";

export const isMockMode = import.meta.env.VITE_API_MODE === "mock";
export const api = isMockMode ? mockApi : httpApi;
export { ApiError } from "./client.js";
