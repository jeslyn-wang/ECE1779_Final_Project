// Firebase web config comes from VITE_FIREBASE_* variables at build time.
// These values are public by design (they identify the project, they aren't secrets);
// security comes from the backend verifying the ID token on every protected request.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId);
export const firebaseAuth = firebaseConfigured ? getAuth(initializeApp(config)) : null;

/** Turns Firebase error codes into messages people can act on. */
export function firebaseErrorMessage(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return { message: "Email or password is incorrect." };
    case "auth/email-already-in-use":
      return { fieldErrors: { email: "An account with this email already exists." } };
    case "auth/invalid-email":
      return { fieldErrors: { email: "Enter a valid email address." } };
    case "auth/weak-password":
      return { fieldErrors: { password: "Use at least 8 characters." } };
    case "auth/too-many-requests":
      return { message: "Too many attempts. Please wait a few minutes and try again." };
    case "auth/network-request-failed":
      return { message: "Can't reach the sign-in service. Check your connection." };
    default:
      return { message: error?.message || "Something went wrong. Please try again." };
  }
}
