import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { api, isMockMode, ApiError } from "../api/index.js";
import { setTokenGetter } from "../api/client.js";
import { mockAuth } from "../api/mockApi.js";
import { firebaseAuth, firebaseConfigured, firebaseErrorMessage } from "../lib/firebase.js";

const AuthContext = createContext(null);

// Firebase errors become ApiErrors so forms handle every failure the same way.
function toApiError(error) {
  if (error instanceof ApiError) return error;
  const { message, fieldErrors } = firebaseErrorMessage(error);
  return new ApiError(message || "Please fix the highlighted fields.", 400, fieldErrors || {});
}

/**
 * Provides { user, status, signIn, signUp, signOut, refreshUser, setUser }.
 * `user` is the app's own profile from GET /api/me ({ id, displayName, email }),
 * not the raw Firebase user. status: "loading" | "ready".
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [profileError, setProfileError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const { user: profile } = await api.getMe();
      setUser(profile);
      setProfileError("");
    } catch (error) {
      setUser(null);
      if (error.status !== 401) setProfileError(error.message);
    }
  }, []);

  useEffect(() => {
    if (isMockMode) {
      setTokenGetter(async () => (mockAuth.hasSession() ? "mock-token" : null));
      (mockAuth.hasSession() ? loadProfile() : Promise.resolve()).finally(() => setStatus("ready"));
      return undefined;
    }

    if (!firebaseConfigured) {
      setTokenGetter(async () => null);
      setStatus("ready");
      return undefined;
    }

    setTokenGetter(async () => (firebaseAuth.currentUser ? firebaseAuth.currentUser.getIdToken() : null));
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) await loadProfile();
      else setUser(null);
      setStatus("ready");
    });
  }, [loadProfile]);

  const signIn = useCallback(
    async (email, password) => {
      try {
        if (isMockMode) await mockAuth.signIn(email, password);
        else await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        await loadProfile();
      } catch (error) {
        throw toApiError(error);
      }
    },
    [loadProfile]
  );

  const signUp = useCallback(
    async (displayName, email, password) => {
      try {
        if (isMockMode) {
          await mockAuth.signUp(displayName, email, password);
        } else {
          const { user: firebaseUser } = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
          await updateProfile(firebaseUser, { displayName: displayName.trim() });
          // The backend may have created the profile before the name was set, so set it explicitly.
          await api.updateMe({ displayName: displayName.trim() });
        }
        await loadProfile();
      } catch (error) {
        throw toApiError(error);
      }
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    if (isMockMode) await mockAuth.signOut();
    else if (firebaseAuth) await firebaseSignOut(firebaseAuth);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      profileError,
      authAvailable: isMockMode || firebaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshUser: loadProfile,
      setUser,
    }),
    [user, status, profileError, signIn, signUp, signOut, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
