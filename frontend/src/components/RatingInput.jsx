import { useRef, useState } from "react";

const LABELS = ["", "Not for me", "It was okay", "Good", "Really good", "Loved it"];

/** Pick 1-5 stars. Works with mouse, touch and keyboard (arrow keys). */
export default function RatingInput({ value, onChange, invalid = false }) {
  const [hover, setHover] = useState(0);
  const buttons = useRef([]);
  const shown = hover || value;

  function choose(n) {
    onChange(n);
    buttons.current[n - 1]?.focus();
  }

  function handleKeyDown(event) {
    const current = value || 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      choose(Math.min(5, current + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      choose(Math.max(1, current - 1));
    }
  }

  return (
    <div className="rating-input-row">
      <div
        className={`rating-input${invalid ? " invalid" : ""}`}
        role="radiogroup"
        aria-label="Your rating"
        aria-invalid={invalid || undefined}
        onMouseLeave={() => setHover(0)}
        onKeyDown={handleKeyDown}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => (buttons.current[n - 1] = el)}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}, ${LABELS[n]}`}
            tabIndex={(value || 1) === n ? 0 : -1}
            className={n <= shown ? "on" : ""}
            onMouseEnter={() => setHover(n)}
            onClick={() => choose(n)}
          >
            ★
          </button>
        ))}
      </div>
      <span className="rating-word muted" aria-hidden="true">
        {LABELS[shown] || "Tap a star"}
      </span>
    </div>
  );
}
