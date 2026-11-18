// PSEUDO DATA. The backend does not track how many cards are New, Due or in Review
// yet, so these numbers are made up. They come from the deck's id, so a deck always
// shows the same numbers (they don't jump around when the page re-renders).
//
// When the backend can provide real counts, delete this file and read the counts from
// the deck / subdeck data in LibraryDeck.jsx instead.

// Turns any text (here, a deck's id) into one whole number.
// The same text always gives the same number, which keeps the fake counts steady.
function hash(text) {
  let h = 2166136261;

  // Mix each character of the text into the running number.
  // Multiplying by a large prime makes small changes in the text change the whole result.
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }

  // Force the result to be a positive whole number.
  return h >>> 0;
}

// Makes up New, Due and Review counts for a deck or subdeck from its id.
export function pseudoCounts(id) {
  const h = hash(id);

  // Use a different part of the number for each count, and take the remainder
  // so each stays small: New is 0-11, Due is 0-3, Review is 0-8.
  return {
    new: h % 12,
    due: (h >>> 4) % 4,
    review: (h >>> 8) % 9,
  };
}
