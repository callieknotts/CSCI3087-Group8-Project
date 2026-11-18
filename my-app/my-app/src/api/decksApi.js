// Talks to Dylan's FastAPI deck endpoints. In development the Vite proxy sends
// /api/... to http://localhost:8000/... (see vite.config.js).
//
// This file only sends requests and turns the answers into data or a readable
// error. The real rules (who owns a deck, what names are allowed) live in the backend.

// The trailing slash matters. FastAPI answers /decks (no slash) with a redirect to an
// absolute http://localhost:8000/decks/ address, and the browser would then skip the proxy.
const DECKS_URL = '/api/decks/';

// An error that also remembers which HTTP status the backend answered with.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // the HTTP status, or 0 when the server could not be reached
  }
}

// The backend reports problems in different shapes: a text message, a list of
// validation problems, or (for crashes) plain text with no JSON at all.
function messageFrom(body, status) {
  if (body && typeof body.detail === 'string') {
    return body.detail;
  }
  if (body && Array.isArray(body.detail) && body.detail[0]?.msg) {
    return body.detail[0].msg.replace(/^Value error, /, '');
  }
  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  return `Something went wrong (error ${status}).`;
}

// Sends one request and returns the answer as data, or throws an ApiError if anything goes wrong.
async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      credentials: 'include', // sends the session cookie from logging in
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Try again.');
  }

  // The backend answered with an error: read its message and throw it.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, messageFrom(body, res.status));
  }

  // The request worked: return the answer (or null if it has no data).
  return res.json().catch(() => null);
}

// Get all of the user's decks.
export function listDecks() {
  return request(DECKS_URL);
}

// Add a new deck.
export function createDeck(deckname, description) {
  return request(DECKS_URL, {
    method: 'POST',
    body: JSON.stringify({ deckname, description }),
  });
}

// `fields` holds only what changed, for example { deckname: 'New name' }.
export function updateDeck(deckId, fields) {
  return request(`${DECKS_URL}${deckId}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

// Subdecks of one deck. NOTE: the backend raises an error (HTTP 500) when a deck has no
// subdecks yet, instead of returning an empty list, so callers must treat that case as "none".
export function listSubdecks(deckId) {
  return request(`${DECKS_URL}${deckId}/subdecks/`);
}

// Delete a deck.
export function deleteDeck(deckId) {
  return request(`${DECKS_URL}${deckId}`, { method: 'DELETE' });
}
