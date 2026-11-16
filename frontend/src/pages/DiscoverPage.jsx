import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/index.js";
import { useAsync } from "../lib/useAsync.js";
import { plural } from "../lib/format.js";
import RestaurantCard from "../components/RestaurantCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/States.jsx";

const PAGE_SIZE = 12;
const SORTS = [
  { value: "rating", label: "Top rated" },
  { value: "reviews", label: "Most reviewed" },
  { value: "name", label: "A to Z" },
];

export default function DiscoverPage() {
  // Search state lives in the URL, so results can be shared, bookmarked and survive Back.
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const cuisine = params.get("cuisine") ?? "";
  const sort = SORTS.some((s) => s.value === params.get("sort")) ? params.get("sort") : "rating";
  const page = Math.max(Number(params.get("page")) || 1, 1);

  function updateParams(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "" || (key === "sort" && value === "rating") || (key === "page" && value === 1)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setParams(next, { replace: true });
  }

  // Typing updates the search after a short pause instead of on every keystroke.
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    const trimmed = draft.trim();
    if (trimmed === q) return undefined;
    const timer = setTimeout(() => updateParams({ q: trimmed, page: null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const cuisines = useAsync(() => api.listCuisines(), []);
  const results = useAsync(
    () => api.listRestaurants({ q, cuisine, sort, page, pageSize: PAGE_SIZE }),
    [q, cuisine, sort, page]
  );

  const data = results.data;
  const totalPages = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;
  const filtering = Boolean(q || cuisine);

  return (
    <div className="discover">
      <section className="hero">
        <h1>Find your next favourite spot in Toronto.</h1>
        <p className="muted">Honest ratings from people who eat like you.</p>
        <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="search" className="visually-hidden">
            Search restaurants
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by name, cuisine or neighbourhood"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
          />
        </form>
      </section>

      <div className="filters">
        <div className="chips" role="group" aria-label="Filter by cuisine">
          <button
            type="button"
            className={`chip${cuisine === "" ? " chip-on" : ""}`}
            aria-pressed={cuisine === ""}
            onClick={() => updateParams({ cuisine: null, page: null })}
          >
            All
          </button>
          {(cuisines.data?.cuisines ?? []).map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${cuisine === c ? " chip-on" : ""}`}
              aria-pressed={cuisine === c}
              onClick={() => updateParams({ cuisine: cuisine === c ? null : c, page: null })}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="sort">
          <span className="muted small">Sort</span>
          <select value={sort} onChange={(event) => updateParams({ sort: event.target.value, page: null })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {results.error && !data ? (
        <ErrorState error={results.error} onRetry={results.reload} />
      ) : !data ? (
        <LoadingState label="Finding restaurants…" />
      ) : data.restaurants.length === 0 ? (
        <EmptyState title="No restaurants match that.">
          {filtering && (
            <button type="button" className="btn btn-secondary" onClick={() => updateParams({ q: null, cuisine: null, page: null })}>
              Clear search
            </button>
          )}
        </EmptyState>
      ) : (
        <>
          <p className="result-count muted small" aria-live="polite">
            {results.loading ? "Updating…" : `${plural(data.total, "restaurant")}${filtering ? " found" : ""}`}
          </p>
          <div className={`grid${results.loading ? " is-stale" : ""}`}>
            {data.restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => updateParams({ page: page - 1 })}>
                Previous
              </button>
              <span className="muted small">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: page + 1 })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
