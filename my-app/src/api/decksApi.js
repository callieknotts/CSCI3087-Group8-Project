const DECKS_URL = '/api/decks/';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

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
      credentials: 'include',
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

// -------------------- DECKS --------------------

export function listDecks() {
  return request(DECKS_URL);
}

// One deck. NOTE: the backend answers 200 with an empty body (null) when the deck does
// not exist, so callers must check for null.
export function getDeck(deckId) {
  return request(`${DECKS_URL}${deckId}`);
}

export function createDeck(deckname, description = null) {
  return request(DECKS_URL, {
    method: 'POST',
    body: JSON.stringify({
      deckname,
      description,
    }),
  });
}

export function updateDeck(deckId, fields) {
  return request(`${DECKS_URL}${deckId}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

export function deleteDeck(deckId) {
  return request(`${DECKS_URL}${deckId}`, {
    method: 'DELETE',
  });
}

// -------------------- SUBDECKS --------------------

export function listSubdecks(deckId) {
  return request(`${DECKS_URL}${deckId}/subdecks/`);
}

// One subdeck. NOTE: the backend raises an error (HTTP 500) when the subdeck does not exist.
export function getSubdeck(deckId, subdeckId) {
  return request(`${DECKS_URL}${deckId}/subdecks/${subdeckId}`);
}

export function createSubdeck(deckId, subdeckname) {
  return request(`${DECKS_URL}${deckId}/subdecks/`, {
    method: 'POST',
    body: JSON.stringify({ subdeckname }),
  });
}

export function updateSubdeck(deckId, subdeckId, fields) {
  return request(
    `${DECKS_URL}${deckId}/subdecks/${subdeckId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(fields),
    },
  );
}

export function deleteSubdeck(deckId, subdeckId) {
  return request(
    `${DECKS_URL}${deckId}/subdecks/${subdeckId}`,
    {
      method: 'DELETE',
    },
  );
}

// -------------------- CARDS --------------------

// The cards of a deck. Without subdeckId this is EVERY card in the deck (the ones inside
// its subdecks and the ones with no subdeck). With subdeckId it is only that subdeck's cards.
// Each card looks like:
//   { id, deck_id, subdeck_id, position,
//     content: { front: { text, image_key }, back: { text, image_key } } }
export function listCards(deckId, subdeckId = null) {
  let url = `${DECKS_URL}${deckId}/cards/`;

  if (subdeckId) {
    url += `?subdeck_id=${encodeURIComponent(subdeckId)}`;
  }

  return request(url);
}

export function createCard(deckId, card) {
  return request(`${DECKS_URL}${deckId}/cards/`, {
    method: 'POST',
    body: JSON.stringify(card),
  });
}

export function updateCard(deckId, cardId, fields) {
  return request(
    `${DECKS_URL}${deckId}/cards/${cardId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(fields),
    },
  );
}

export function deleteCard(deckId, cardId) {
  return request(
    `${DECKS_URL}${deckId}/cards/${cardId}`,
    {
      method: 'DELETE',
    },
  );
}