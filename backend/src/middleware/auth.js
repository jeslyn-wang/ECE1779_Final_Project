// Firebase sign-in check for the API.
//
// The frontend signs people in with Firebase and sends
//   Authorization: Bearer <Firebase ID token>
// on every request. We verify that token here, then find (or create) the matching
// row in our own users table, so routes get req.user = { id, displayName, email }.
//
// Verifying ID tokens only needs the Firebase project ID (FIREBASE_PROJECT_ID);
// no service account key is required.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { pool } from "../db.js";

const projectId = process.env.FIREBASE_PROJECT_ID;
const firebaseAuth = projectId ? getAuth(initializeApp({ projectId })) : null;

// Local testing without Firebase: with AUTH_DEV_BYPASS=true, the token
// "dev:<firebase_uid>" signs you in as that user (e.g. "dev:mock-alice" from seed.sql).
// Never allowed when NODE_ENV=production (Kubernetes sets that).
const devBypass =
  process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production";

if (!firebaseAuth && !devBypass) {
  console.warn("FIREBASE_PROJECT_ID is not set: signed-in endpoints will return 401.");
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

// Turns a token into { uid, email, name }, or null if it isn't valid.
async function verifyToken(token) {
  if (devBypass && token.startsWith("dev:")) {
    const uid = token.slice("dev:".length);
    return uid ? { uid, email: null, name: null } : null;
  }
  if (!firebaseAuth) return null;
  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || null, name: decoded.name || null };
  } catch {
    return null; // expired, malformed, or from another project
  }
}

// Finds the users row for this Firebase account, creating it on first sign-in.
// Name comes from the token, or the part of the email before the @.
async function findOrCreateUser({ uid, email, name }) {
  const existing = await pool.query(
    `SELECT id, display_name, email FROM users WHERE firebase_uid = $1`,
    [uid]
  );
  let row = existing.rows[0];

  if (!row) {
    const displayName = (name || (email ? email.split("@")[0] : "") || "New user").slice(0, 50);
    // ON CONFLICT covers two first requests from the same person arriving at once.
    const created = await pool.query(
      `
      INSERT INTO users (firebase_uid, display_name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (firebase_uid) DO UPDATE SET firebase_uid = EXCLUDED.firebase_uid
      RETURNING id, display_name, email
      `,
      [uid, displayName, email]
    );
    row = created.rows[0];
  } else if (email && row.email !== email) {
    // Keep the stored email in step with the Firebase account.
    await pool.query(`UPDATE users SET email = $1 WHERE id = $2`, [email, row.id]);
    row.email = email;
  }

  return { id: row.id, displayName: row.display_name, email: row.email };
}

async function loadUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  const identity = await verifyToken(token);
  return identity ? findOrCreateUser(identity) : null;
}

// For public endpoints: sets req.user if signed in, otherwise req.user = null.
export async function optionalAuth(req, _res, next) {
  try {
    req.user = await loadUser(req);
    next();
  } catch (error) {
    next(error);
  }
}

// For 🔒 endpoints: 401 unless the request has a valid token.
export async function requireAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    if (!req.user) return res.status(401).json({ error: "Please log in to continue." });
    next();
  } catch (error) {
    next(error);
  }
}