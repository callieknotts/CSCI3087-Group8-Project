// PSEUDO DATA. The backend does not track how many cards are New, Due or in Review
// yet, so these numbers are made up. They come from the deck's id, so a deck always
// shows the same numbers (they don't jump around when the page re-renders).
//
// When the backend can provide real counts, delete this file and read the counts from
// the deck / subdeck data in LibraryDeck.jsx instead.

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pseudoCounts(id) {
  const h = hash(id);
  return {
    new: h % 12,
    due: (h >>> 4) % 4,
    review: (h >>> 8) % 9,
  };
}
