import { initials, tileColour } from "../lib/format.js";

export default function Avatar({ name, size = "md" }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ background: tileColour(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
