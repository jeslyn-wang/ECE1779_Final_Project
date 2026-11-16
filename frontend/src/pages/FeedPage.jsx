import { Link } from "react-router-dom";
import { api } from "../api/index.js";
import { useAsync } from "../lib/useAsync.js";
import { plural } from "../lib/format.js";
import ReviewCard from "../components/ReviewCard.jsx";
import Avatar from "../components/Avatar.jsx";
import FollowButton from "../components/FollowButton.jsx";
import TasteMatch from "../components/TasteMatch.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";

function SuggestedPeople({ onFollowed }) {
  const suggested = useAsync(() => api.suggestedUsers(), []);

  return (
    <div className="card">
      <h2>People with your taste</h2>
      <p className="muted small">Based on restaurants you've both rated.</p>
      {suggested.error ? (
        <ErrorState error={suggested.error} onRetry={suggested.reload} />
      ) : !suggested.data ? (
        <LoadingState />
      ) : suggested.data.users.length === 0 ? (
        <p className="muted small">Rate a few restaurants and we'll find people who eat like you.</p>
      ) : (
        <ul className="people">
          {suggested.data.users.map((person) => (
            <li key={person.id}>
              <Avatar name={person.displayName} />
              <div className="people-info">
                <Link to={`/users/${person.id}`} className="strong-link">
                  {person.displayName}
                </Link>
                <TasteMatch match={person.tasteMatch} compact />
                <span className="muted small">{plural(person.reviewCount, "review")}</span>
              </div>
              <FollowButton userId={person.id} isFollowing={person.isFollowing} size="sm" onChange={onFollowed} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FeedPage() {
  const feed = useAsync(() => api.getFeed(), []);

  return (
    <div className="feed-page">
      <h1>Your feed</h1>
      <div className="feed-layout">
        <section aria-label="Reviews from people you follow">
          {feed.error && !feed.data ? (
            <ErrorState error={feed.error} onRetry={feed.reload} />
          ) : !feed.data ? (
            <LoadingState label="Loading your feed…" />
          ) : feed.data.reviews.length === 0 ? (
            <EmptyState title="Your feed is empty.">
              Follow people to see their reviews here. Start with the suggestions, or{" "}
              <Link to="/">browse restaurants</Link>.
            </EmptyState>
          ) : (
            <div className="review-list">
              {feed.data.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} show="both" />
              ))}
            </div>
          )}
        </section>
        <aside>
          <SuggestedPeople onFollowed={feed.reload} />
        </aside>
      </div>
    </div>
  );
}
