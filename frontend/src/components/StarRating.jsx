import { formatRating } from "../lib/format.js";

/** Read-only stars. Supports fractions (e.g. 4.3 fills 86% of the row). */
export default function StarRating({ value, size = "md", showValue = false }) {
  const percent = value ? Math.max(0, Math.min(100, (value / 5) * 100)) : 0;
  const label = value ? `${formatRating(value)} out of 5 stars` : "No ratings yet";

  return (
    <span className={`stars stars-${size}`} role="img" aria-label={label}>
      <span className="stars-track" aria-hidden="true">
        ★★★★★
        <span className="stars-fill" style={{ width: `${percent}%` }}>
          ★★★★★
        </span>
      </span>
      {showValue && <span className="stars-value">{formatRating(value)}</span>}
    </span>
  );
}
