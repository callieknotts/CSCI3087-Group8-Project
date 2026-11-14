// Sorting for the Library page. The backend's "get all decks" returns every deck in no
// particular order and has no sort options, so the page sorts what it received.

// key: 'created_at' | 'opened_at' | 'deckname'      order: 'asc' | 'desc'
export function sortDecks(decks, key, order) {
  const direction = order === 'desc' ? -1 : 1;

  function valueOf(deck) {
    if (key === 'deckname') {
      return deck.deckname.toLowerCase();
    }
    // The backend has no "opened at" field yet, so it falls back to created_at.
    // TODO: use the real opened-at value once the backend sends one.
    // created_at is an ISO date string, which sorts correctly as plain text.
    return deck.created_at ?? '';
  }

  return [...decks].sort((a, b) => {
    const x = valueOf(a);
    const y = valueOf(b);
    if (x < y) return -direction;
    if (x > y) return direction;
    // same value: keep a steady order by name
    return a.deckname.localeCompare(b.deckname);
  });
}

// Subdecks are always shown alphabetically.
export function sortSubdecks(subdecks) {
  return [...subdecks].sort((a, b) =>
    a.subdeckname.localeCompare(b.subdeckname, undefined, { sensitivity: 'base' }),
  );
}
