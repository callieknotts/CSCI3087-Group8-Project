// Type-it-out mode: the front of a card is shown and the person types its back.
// It only works for SINGLE-WORD answers, so cards whose back is more than one word are left out.

const clean = (text) => (typeof text === 'string' ? text.trim() : '');

// True when the text is exactly one word (no spaces inside it).
export function isSingleWord(text) {
  const value = clean(text);
  return value.length > 0 && !/\s/.test(value);
}

// The cards that can be used here: text on the front, and a one-word text back.
export function typeableCards(cards) {
  return cards.filter(
    (card) => clean(card.content?.front?.text) && isSingleWord(card.content?.back?.text),
  );
}

// Lower case, no spaces around it, no punctuation around it ("Mitosis." matches "mitosis").
function normalize(text) {
  return clean(text)
    .normalize('NFC')
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

// The same, and with accents taken off too ("cafe" and "café")
function withoutAccents(text) {
  return normalize(text).normalize('NFD').replace(/\p{M}/gu, '');
}

// How did the typed answer do? 'correct' | 'accent' (right letters, wrong accents) | 'wrong'
// Capital letters and punctuation around the word do not matter.
export function checkAnswer(typed, expected) {
  const a = normalize(typed);
  const b = normalize(expected);
  if (!a) return 'wrong';
  if (a === b) return 'correct';
  if (withoutAccents(typed) === withoutAccents(expected)) return 'accent';
  return 'wrong';
}
