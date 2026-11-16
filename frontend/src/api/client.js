// Low-level HTTP helper for the Express API. Every endpoint lives under /api,
// which NGINX (Docker/Kubernetes) and the Vite dev proxy forward to the backend.

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// The auth layer registers a function that returns the current Firebase ID token
// (or null when signed out). Kept as a setter so this file doesn't depend on Firebase.
let getToken = async () => null;

export function setTokenGetter(fn) {
  getToken = fn;
}

function fallbackMessage(status) {
  if (status === 401) return "Please log in to continue.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find that.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  return "Something went wrong. Please try again.";
}

/**
 * @param {string} path  Path after /api, e.g. "/restaurants?q=sushi"
 * @param {{ method?: string, body?: unknown, auth?: boolean }} options
 *   auth: true means the endpoint requires a signed-in user.
 */
export async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // Send the token whenever we have one, so public endpoints can still personalise
  // their response (isFollowing, tasteMatch, ...).
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (auth) throw new ApiError(fallbackMessage(401), 401);

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || fallbackMessage(response.status), response.status, data.errors || {});
  }
  return data;
}

/** Builds "?a=1&b=2", skipping empty values. */
export function queryString(params = {}) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  const text = new URLSearchParams(entries).toString();
  return text ? `?${text}` : "";
}
