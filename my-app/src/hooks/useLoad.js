import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

// Runs an async loader when a page opens (and again when `key` changes or retry() is called).
// Returns { status: 'loading' | 'ready' | 'error', data, message, retry }.
// An expired session (401) sends the person back to login instead of showing an error.
export function useLoad(loader, key) {
  const { onUnauthorized } = useOutletContext();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ requestId: null });

  // Which request this render is waiting for. A stored result only counts if it is for it,
  // so opening a different deck never shows the previous deck's data.
  const requestId = `${key}#${attempt}`;

  // Keep the latest loader and onUnauthorized without restarting the effect when they change.
  const loaderRef = useRef(loader);
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    loaderRef.current = loader;
    onUnauthorizedRef.current = onUnauthorized;
  });

  useEffect(() => {
    let ignore = false; // stops an old request from changing state after a newer one started

    loaderRef
      .current()
      .then((data) => {
        if (!ignore) setResult({ requestId, status: 'ready', data });
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) {
          onUnauthorizedRef.current();
          return;
        }
        setResult({ requestId, status: 'error', message: err.message });
      });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  const done = result.requestId === requestId;
  return {
    status: done ? result.status : 'loading',
    data: done ? result.data : undefined,
    message: done ? result.message : '',
    retry: () => setAttempt((n) => n + 1),
  };
}
