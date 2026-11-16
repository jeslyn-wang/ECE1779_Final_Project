import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { isMockMode } from "../api/index.js";
import { mockAuth } from "../api/mockApi.js";
import { APP_NAME } from "../config.js";

export default function Layout() {
  const { user, status, profileError, authAvailable, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  function resetDemo() {
    mockAuth.resetDemoData();
    window.location.assign("/");
  }

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            {APP_NAME}
          </Link>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Discover
            </NavLink>
            {user && <NavLink to="/feed">Feed</NavLink>}
          </nav>
          <div className="nav-account">
            {status === "ready" && user && (
              <>
                <NavLink to={`/users/${user.id}`} className="nav-user">
                  {user.displayName}
                </NavLink>
                <button type="button" className="btn-link" onClick={handleSignOut}>
                  Log out
                </button>
              </>
            )}
            {status === "ready" && !user && authAvailable && (
              <>
                <NavLink to="/login">Log in</NavLink>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {!authAvailable && (
        <p className="banner">
          Sign-in isn't configured yet: set the VITE_FIREBASE_* variables, or run <code>npm run dev:mock</code> to try
          the app with demo data.
        </p>
      )}
      {profileError && (
        <p className="banner" role="alert">
          You're signed in, but we couldn't load your profile: {profileError}
        </p>
      )}

      <main id="main" className="main">
        <Outlet />
      </main>

      <footer className="footer muted small">
        <span>{APP_NAME} · Find where Toronto eats</span>
        {isMockMode && (
          <span className="demo-note">
            Demo mode: sample data, stored only in this browser.{" "}
            {confirmReset ? (
              <>
                Reset everything?{" "}
                <button type="button" className="btn-link" onClick={resetDemo}>
                  Yes, reset
                </button>{" "}
                <button type="button" className="btn-link" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className="btn-link" onClick={() => setConfirmReset(true)}>
                Reset demo data
              </button>
            )}
          </span>
        )}
      </footer>
    </div>
  );
}
