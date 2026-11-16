import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { plural } from "../lib/format.js";
import Avatar from "../components/Avatar.jsx";
import FollowButton from "../components/FollowButton.jsx";
import TasteMatch from "../components/TasteMatch.jsx";
import ReviewCard from "../components/ReviewCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";
import NotFoundPage from "./NotFoundPage.jsx";

function EditName({ current, onDone }) {
  const { setUser } = useAuth();
  const [name, setName] = useState(current);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      setError("Use 2 to 50 characters.");
      return;
    }
    setSaving(true);
    try {
      const { user } = await api.updateMe({ displayName: trimmed });
      setUser(user);
      onDone(user.displayName);
    } catch (err) {
      setError(err.fieldErrors?.displayName || err.message);
      setSaving(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit} noValidate>
      <label className="visually-hidden" htmlFor="display-name">
        Display name
      </label>
      <input id="display-name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} autoFocus />
      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDone(null)} disabled={saving}>
        Cancel
      </button>
      {error && <span className="field-error">{error}</span>}
    </form>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const profile = useAsync(() => api.getUser(id), [id]);
  const reviews = useAsync(() => api.listUserReviews(id), [id]);
  const [editing, setEditing] = useState(false);

  if (profile.error?.status === 404) return <NotFoundPage what="person" />;
  if (profile.error) return <ErrorState error={profile.error} onRetry={profile.reload} />;
  if (!profile.data) return <LoadingState />;

  const person = profile.data.user;
  const joined = new Date(person.createdAt).toLocaleDateString("en-CA", { month: "long", year: "numeric" });

  return (
    <div className="profile-page">
      <section className="profile-header card">
        <Avatar name={person.displayName} size="lg" />
        <div className="profile-main">
          {editing ? (
            <EditName
              current={person.displayName}
              onDone={(newName) => {
                setEditing(false);
                if (newName) profile.setData((d) => ({ user: { ...d.user, displayName: newName } }));
              }}
            />
          ) : (
            <h1>
              {person.displayName}
              {person.isMe && (
                <button type="button" className="btn-link small edit-name" onClick={() => setEditing(true)}>
                  Edit name
                </button>
              )}
            </h1>
          )}
          <p className="muted small">Joined {joined}</p>
          <p className="stats">
            <span>
              <strong>{person.reviewCount}</strong> {person.reviewCount === 1 ? "review" : "reviews"}
            </span>
            <span>
              <strong>{person.followerCount}</strong> {person.followerCount === 1 ? "follower" : "followers"}
            </span>
            <span>
              <strong>{person.followingCount}</strong> following
            </span>
          </p>
          {person.tasteMatch && <TasteMatch match={person.tasteMatch} />}
        </div>
        {!person.isMe && (
          <FollowButton
            key={`${person.id}-${person.isFollowing}`}
            userId={person.id}
            isFollowing={person.isFollowing}
            onChange={(following) =>
              profile.setData((d) => ({
                user: { ...d.user, isFollowing: following, followerCount: d.user.followerCount + (following ? 1 : -1) },
              }))
            }
          />
        )}
      </section>

      <section aria-labelledby="profile-reviews">
        <h2 id="profile-reviews">{person.isMe ? "Your reviews" : `${person.displayName}'s reviews`}</h2>
        {reviews.error && !reviews.data ? (
          <ErrorState error={reviews.error} onRetry={reviews.reload} />
        ) : !reviews.data ? (
          <LoadingState />
        ) : reviews.data.reviews.length === 0 ? (
          <EmptyState title={person.isMe ? "You haven't reviewed anywhere yet." : "No reviews yet."} />
        ) : (
          <>
            <p className="muted small">{plural(reviews.data.reviews.length, "restaurant")} rated</p>
            <div className="review-list">
              {reviews.data.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} show="restaurant" />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
