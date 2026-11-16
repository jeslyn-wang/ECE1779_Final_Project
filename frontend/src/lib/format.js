const relative = new Intl.RelativeTimeFormat("en-CA", { numeric: "auto" });
const absolute = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });

/** "2 days ago", "last week", or a date for anything older than ~a month. */
export function timeAgo(isoDate, now = Date.now()) {
  const date = new Date(isoDate);
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 7) return relative.format(Math.round(seconds / 86400), "day");
  if (abs < 86400 * 30) return relative.format(Math.round(seconds / (86400 * 7)), "week");
  return absolute.format(date);
}

export function formatRating(value) {
  return value === null || value === undefined ? "–" : Number(value).toFixed(1);
}

export function priceLabel(level) {
  return level ? "$".repeat(level) : "";
}

export function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// A stable, soft colour per cuisine for the restaurant tiles.
const TILE_COLOURS = ["#f4d9c6", "#dfe8d0", "#f6e3a8", "#d6e4ef", "#ecd5e3", "#f3cfc4", "#d9ead8", "#e6dcf0"];

export function tileColour(key = "") {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TILE_COLOURS[hash % TILE_COLOURS.length];
}
