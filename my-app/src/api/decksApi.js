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

// One deck. NOTE: the backend answers 200 with an empty body (null) when the deck does
// not exist, so callers must check for null.
export function getDeck(deckId) {
  return request(`${DECKS_URL}${deckId}`);
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

// Subdecks of one deck. NOTE: the backend raises an error (HTTP 500) when a deck has no
// subdecks yet, instead of returning an empty list, so callers must treat that case as "none".
export function listSubdecks(deckId) {
  return request(`${DECKS_URL}${deckId}/subdecks/`);
}

// One subdeck. NOTE: the backend raises an error (HTTP 500) when the subdeck does not exist.
export function getSubdeck(deckId, subdeckId) {
  return request(`${DECKS_URL}${deckId}/subdecks/${subdeckId}`);
}

export function deleteDeck(deckId) {
  return request(`${DECKS_URL}${deckId}`, { method: 'DELETE' });
}

// The cards of a deck. Without subdeckId this is EVERY card in the deck (the ones inside
// its subdecks and the ones with no subdeck). With subdeckId it is only that subdeck's cards.
// Each card looks like:
//   { id, deck_id, subdeck_id, position,
//     content: { front: { text, image_key }, back: { text, image_key } } }
export function listCards(deckId, subdeckId) {
  const query = subdeckId ? `?subdeck_id=${encodeURIComponent(subdeckId)}` : '';
  return request(`${DECKS_URL}${deckId}/cards/${query}`);
}
