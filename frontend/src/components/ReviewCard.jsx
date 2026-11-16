import { Link } from "react-router-dom";
import StarRating from "./StarRating.jsx";
import Avatar from "./Avatar.jsx";
import { timeAgo } from "../lib/format.js";

/**
 * One review. `show` controls the header:
 *   "user"       -> who wrote it (on a restaurant page)
 *   "restaurant" -> where it was (on a profile)
 *   "both"       -> who and where (in the feed)
 */
export default function ReviewCard({ review, show = "user", actions = null }) {
  const showUser = show === "user" || show === "both";
  const showRestaurant = show === "restaurant" || show === "both";

  return (
    <article className="review">
      <header className="review-header">
        {showUser && <Avatar name={review.user.displayName} />}
        <div className="review-meta">
          <p className="review-who">
            {showUser && (
              <Link to={`/users/${review.user.id}`} className="strong-link">
                {review.user.displayName}
              </Link>
            )}
            {show === "both" && <span className="muted"> reviewed </span>}
            {showRestaurant && (
              <Link to={`/restaurants/${review.restaurant.id}`} className="strong-link">
                {review.restaurant.name}
              </Link>
            )}
          </p>
          <p className="review-sub">
            <StarRating value={review.rating} size="sm" />
            <span className="muted small">
              {timeAgo(review.createdAt)}
              {review.updatedAt ? " · edited" : ""}
            </span>
          </p>
        </div>
        {actions && <div className="review-actions">{actions}</div>}
      </header>
      {review.body && <p className="review-body">{review.body}</p>}
    </article>
  );
}
