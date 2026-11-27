// Sorting for the Library page. The page sorts the decks it received itself, so the
// dropdowns react instantly without asking the backend again.

// key: 'created_at' | 'opened_at' | 'deckname'      order: 'asc' | 'desc'
export function sortDecks(decks, key, order) {
  const direction = order === 'desc' ? -1 : 1;

  function valueOf(deck) {
    if (key === 'deckname') {
      return deck.deckname.toLowerCase();
    }
    // "Opened at" uses the backend's last_opened_at, and falls back to created_at if a deck
    // has none. Both are ISO date strings, which sort correctly as plain text.
    if (key === 'opened_at') {
      return deck.last_opened_at ?? deck.created_at ?? '';
    }
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
