// Talks to Dylan's FastAPI deck endpoints. In development the Vite proxy sends
// /api/... to http://localhost:8000/... (see vite.config.js).
//
// This file only sends requests and turns the answers into data or a readable
// error. The real rules (who owns a deck, what names are allowed) live in the backend.

// The trailing slash matters. FastAPI answers /decks (no slash) with a redirect to an
// absolute http://localhost:8000/decks/ address, and the browser would then skip the proxy.
const DECKS_URL = '/api/decks/';

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

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, messageFrom(body, res.status));
  }

  return res.json().catch(() => null);
}

export function listDecks() {
  return request(DECKS_URL);
}

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

export function deleteDeck(deckId) {
  return request(`${DECKS_URL}${deckId}`, { method: 'DELETE' });
}
