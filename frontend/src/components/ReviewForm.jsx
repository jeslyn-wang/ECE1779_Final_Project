import { useState } from "react";
import RatingInput from "./RatingInput.jsx";

const MAX_LENGTH = 2000;

/** Create or edit a review. `onSubmit({ rating, body })` should throw an ApiError on failure. */
export default function ReviewForm({ initial, onSubmit, onCancel, submitLabel = "Post review" }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [body, setBody] = useState(initial?.body ?? "");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!rating) found.rating = "Choose a star rating.";
    if (body.length > MAX_LENGTH) found.body = `Keep it under ${MAX_LENGTH} characters.`;
    setErrors(found);
    setMessage("");
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSubmit({ rating, body: body.trim() });
    } catch (error) {
      setErrors(error.fieldErrors || {});
      if (!error.fieldErrors || !Object.keys(error.fieldErrors).length) setMessage(error.message);
      setSaving(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <span className="label">Your rating</span>
        <RatingInput
          value={rating}
          onChange={(n) => {
            setRating(n);
            setErrors((e) => ({ ...e, rating: undefined }));
          }}
          invalid={Boolean(errors.rating)}
        />
        {errors.rating && <span className="field-error">{errors.rating}</span>}
      </div>

      <label className="field">
        <span className="label">
          Your review <span className="muted">(optional)</span>
        </span>
        <textarea
          rows={4}
          maxLength={MAX_LENGTH}
          value={body}
          placeholder="What did you order? Would you go back?"
          onChange={(event) => setBody(event.target.value)}
          aria-invalid={Boolean(errors.body) || undefined}
        />
        <span className="field-hint muted small">
          {body.length}/{MAX_LENGTH}
        </span>
        {errors.body && <span className="field-error">{errors.body}</span>}
      </label>

      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
