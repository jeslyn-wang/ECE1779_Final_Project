import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { isMockMode } from "../api/index.js";
import { LoadingState } from "../components/States.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values, isSignup) {
  const errors = {};
  if (isSignup) {
    const name = values.displayName.trim();
    if (name.length < 2 || name.length > 50) errors.displayName = "Use 2 to 50 characters.";
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (isSignup) {
    if (values.password.length < 8) errors.password = "Use at least 8 characters.";
    else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
      errors.password = "Use at least one letter and one number.";
    }
  } else if (!values.password) {
    errors.password = "Enter your password.";
  }
  return errors;
}

/** Login and sign-up share one form; `mode` is "login" or "signup". */
export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const { user, status, authAvailable, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [values, setValues] = useState({ displayName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") return <LoadingState />;
  if (user && !submitting) return <Navigate to={from} replace />;

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    const found = validate(values, isSignup);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      if (isSignup) await signUp(values.displayName, values.email, values.password);
      else await signIn(values.email, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrors(error.fieldErrors || {});
      if (!error.fieldErrors || !Object.keys(error.fieldErrors).length) setMessage(error.message);
      setSubmitting(false);
    }
  }

  return (
    <section className="auth card">
      <h1>{isSignup ? "Join the table" : "Welcome back"}</h1>
      <p className="muted">
        {isSignup
          ? "Rate the places you love and find people who eat like you."
          : "Log in to review restaurants and see your feed."}
      </p>

      {!authAvailable && (
        <p className="form-error" role="alert">
          Sign-in isn't configured on this server yet.
        </p>
      )}

      {isMockMode && !isSignup && (
        <p className="hint small">
          Demo account: <code>priya@example.com</code> / <code>password1</code>
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {isSignup && (
          <label className="field">
            <span className="label">Your name</span>
            <input
              autoComplete="name"
              value={values.displayName}
              onChange={update("displayName")}
              aria-invalid={Boolean(errors.displayName) || undefined}
            />
            {errors.displayName && <span className="field-error">{errors.displayName}</span>}
          </label>
        )}
        <label className="field">
          <span className="label">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={update("email")}
            aria-invalid={Boolean(errors.email) || undefined}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label className="field">
          <span className="label">Password</span>
          <input
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={values.password}
            onChange={update("password")}
            aria-invalid={Boolean(errors.password) || undefined}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !authAvailable}>
          {submitting ? "One moment…" : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="muted small auth-switch">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link to={isSignup ? "/login" : "/signup"} state={location.state}>
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
