import { plural } from "../lib/format.js";

function tone(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

/** "92% taste match · 3 places in common" */
export default function TasteMatch({ match, compact = false }) {
  if (!match) return null;
  return (
    <span
      className={`match match-${tone(match.score)}`}
      title={`Based on ${plural(match.sharedCount, "restaurant")} you've both rated`}
    >
      <strong>{match.score}%</strong> taste match
      {!compact && <span className="match-detail"> · {plural(match.sharedCount, "place")} in common</span>}
    </span>
  );
}
