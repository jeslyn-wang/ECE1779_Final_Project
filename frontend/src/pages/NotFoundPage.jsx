import { Link } from "react-router-dom";

export default function NotFoundPage({ what = "page" }) {
  return (
    <section className="not-found">
      <h1>We couldn't find that {what}.</h1>
      <p className="muted">It may have been removed, or the link is wrong.</p>
      <Link to="/" className="btn btn-primary">
        Back to restaurants
      </Link>
    </section>
  );
}
