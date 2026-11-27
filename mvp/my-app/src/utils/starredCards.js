// Starred cards.
// The stars live in the backend (see listStarredCardIds, starCard and unstarCard in
// api/decksApi.js). This file only holds the helper for counting them.

// How many of these cards are starred. Only cards that still exist are counted, so a star on
// a deleted card never inflates the number.
export function countStarred(cards, starredIds) {
  return cards.filter((card) => starredIds.has(card.id)).length;
}
