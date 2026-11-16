import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs an async loader and tracks { data, error, loading }.
 * Re-runs when `deps` change. Only the newest run may update state, so a slow
 * response for an old search can never overwrite the results of a newer one.
 * While reloading, the previous data stays on screen to avoid flicker.
 */
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const latestRun = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(async () => {
    const runId = ++latestRun.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await run();
      if (runId === latestRun.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (runId === latestRun.current) setState((s) => ({ data: s.data, error, loading: false }));
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setData = useCallback(
    (update) => setState((s) => ({ ...s, data: typeof update === "function" ? update(s.data) : update })),
    []
  );

  return { ...state, reload, setData };
}
