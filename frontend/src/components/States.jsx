// Shared loading / error / empty states so every page handles them the same way.

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p>{error?.message || "Something went wrong."}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}
