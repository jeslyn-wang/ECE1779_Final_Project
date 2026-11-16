import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index.js";
import { useAuth } from "../auth/AuthContext.jsx";

/** Follow / unfollow toggle. Updates instantly and rolls back if the request fails. */
export default function FollowButton({ userId, isFollowing, onChange, size = "md" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(Boolean(isFollowing));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (!user) {
      navigate("/login", { state: { from: `/users/${userId}` } });
      return;
    }
    const next = !following;
    setFollowing(next);
    setBusy(true);
    setError("");
    try {
      await (next ? api.follow(userId) : api.unfollow(userId));
      onChange?.(next);
    } catch (err) {
      setFollowing(!next);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="follow">
      <button
        type="button"
        className={`btn ${following ? "btn-secondary" : "btn-primary"}${size === "sm" ? " btn-sm" : ""}`}
        aria-pressed={following}
        disabled={busy}
        onClick={toggle}
      >
        {following ? "Following" : "Follow"}
      </button>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
