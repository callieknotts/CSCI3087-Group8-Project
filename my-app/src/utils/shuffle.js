// Shuffling for every study mode.
//
// shuffle() is a Fisher-Yates shuffle: every possible order is equally likely (sorting with
// `Math.random() - 0.5` looks like a shuffle but is biased, so it is not used here).
// `random` can be replaced in tests with a function that returns numbers from 0 up to (not including) 1.
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Like shuffle(), but when the person presses "Shuffle" they should always SEE a change:
// the order that comes back is never the same as the one that went in (unless there is only
// one card to put in order).
export function reshuffle(items, random = Math.random) {
  if (items.length < 2) return [...items];
  for (let tries = 0; tries < 5; tries += 1) {
    const result = shuffle(items, random);
    if (result.some((item, i) => item !== items[i])) return result;
  }
  return [...items.slice(1), items[0]]; // extremely unlikely: just move the first card to the end
}
