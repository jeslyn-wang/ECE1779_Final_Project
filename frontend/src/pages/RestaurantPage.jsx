import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../api/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { formatRating, plural, priceLabel } from "../lib/format.js";
import StarRating from "../components/StarRating.jsx";
import ReviewCard from "../components/ReviewCard.jsx";
import ReviewForm from "../components/ReviewForm.jsx";
import { RestaurantTile } from "../components/RestaurantCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";
import NotFoundPage from "./NotFoundPage.jsx";

function RatingBreakdown({ restaurant }) {
  const counts = restaurant.ratingCounts || {};
  const total = restaurant.reviewCount || 0;
  return (
    <div className="breakdown">
      <div className="breakdown-score">
        <span className="big-number">{formatRating(restaurant.avgRating)}</span>
        <StarRating value={restaurant.avgRating} />
        <span className="muted small">{plural(total, "review")}</span>
      </div>
      <ul className="breakdown-bars" aria-label="Ratings breakdown">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = counts[stars] || 0;
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={stars}>
              <span className="small">{stars}★</span>
              <span className="bar" aria-hidden="true">
                <span className="bar-fill" style={{ width: `${percent}%` }} />
              </span>
              <span className="muted small bar-count">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function YourReview({ restaurantId, myReview, onChanged }) {
  const { user } = useAuth();
  const location = useLocation();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="card prompt-card">
        <p>
          <strong>Been here?</strong> <span className="muted">Share how it was.</span>
        </p>
        <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary">
          Log in to review
        </Link>
      </div>
    );
  }

  if (!myReview) {
    return (
      <div className="card">
        <h2>Write a review</h2>
        <ReviewForm
          onSubmit={async (data) => {
            await api.createReview(restaurantId, data);
            await onChanged();
          }}
        />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="card">
        <h2>Edit your review</h2>
        <ReviewForm
          initial={myReview}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (data) => {
            await api.updateReview(myReview.id, data);
            await onChanged();
            setEditing(false);
          }}
        />
      </div>
    );
  }

  async function handleDelete() {
    setError("");
    try {
      await api.deleteReview(myReview.id);
      setConfirmDelete(false);
      await onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card your-review">
      <h2>Your review</h2>
      <ReviewCard review={myReview} show="none" />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {confirmDelete ? (
          <>
            <span className="small">Delete your review?</span>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="btn-link danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function RestaurantPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const restaurant = useAsync(() => api.getRestaurant(id), [id]);
  const reviews = useAsync(() => api.listRestaurantReviews(id), [id]);

  if (restaurant.error?.status === 404) return <NotFoundPage what="restaurant" />;
  if (restaurant.error) return <ErrorState error={restaurant.error} onRetry={restaurant.reload} />;
  if (!restaurant.data) return <LoadingState />;

  const r = restaurant.data.restaurant;
  const allReviews = reviews.data?.reviews ?? [];
  const myReview = user ? allReviews.find((review) => review.user.id === user.id) : null;
  const otherReviews = allReviews.filter((review) => review !== myReview);
  const details = [r.cuisine, r.neighbourhood, priceLabel(r.priceLevel)].filter(Boolean);

  async function refresh() {
    await Promise.all([restaurant.reload(), reviews.reload()]);
  }

  return (
    <div className="restaurant-page">
      <Link to="/" className="back-link small">
        ← All restaurants
      </Link>

      <section className="restaurant-header">
        <RestaurantTile restaurant={r} large />
        <div>
          <h1>{r.name}</h1>
          <p className="muted">{details.join(" · ")}</p>
          {r.address && <p className="small">{r.address}</p>}
        </div>
      </section>

      <div className="restaurant-layout">
        <aside className="restaurant-side">
          <div className="card">
            <RatingBreakdown restaurant={r} />
          </div>
          {reviews.data && <YourReview restaurantId={r.id} myReview={myReview} onChanged={refresh} />}
        </aside>

        <section className="restaurant-reviews" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading">What people are saying</h2>
          {reviews.error && !reviews.data ? (
            <ErrorState error={reviews.error} onRetry={reviews.reload} />
          ) : !reviews.data ? (
            <LoadingState label="Loading reviews…" />
          ) : otherReviews.length === 0 ? (
            <EmptyState title={myReview ? "No one else has reviewed it yet." : "No reviews yet."}>
              {!myReview && "Be the first to say how it was."}
            </EmptyState>
          ) : (
            <div className="review-list">
              {otherReviews.map((review) => (
                <ReviewCard key={review.id} review={review} show="user" />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
