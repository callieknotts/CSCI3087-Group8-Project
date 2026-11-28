// Front & back mode: every card is asked TWICE, once from its front (you see the front and
// recall the back) and once from its back (you see the back and recall the front).
// So a deck of 10 cards becomes 20 questions.

// Two entries per card. Order: every card front-first, then every card back-first.
export function buildSides(cards) {
  const make = (side) => cards.map((card) => ({ key: `${card.id}:${side}`, card, side }));
  return [...make('front'), ...make('back')];
}

// After a shuffle two questions about the SAME card can land next to each other, which would
// give the answer away. Swap entries apart: a swap is only made when it leaves fewer
// neighbouring questions about the same card than before, so this always finishes.
export function spreadPairs(entries) {
  const result = [...entries];
  const clash = (i) =>
    i > 0 && i < result.length && result[i].card.id === result[i - 1].card.id ? 1 : 0;
  // clashes that involve position i or j (each position touches the pair before and after it)
  const local = (i, j) => clash(i) + clash(i + 1) + (j === i + 1 ? 0 : clash(j)) + clash(j + 1);

  for (let pass = 0; pass < 5; pass += 1) {
    let changed = false;
    for (let i = 1; i < result.length; i += 1) {
      if (!clash(i)) continue;
      for (let j = 0; j < result.length; j += 1) {
        if (Math.abs(j - i) < 2) continue;
        const before = local(i, j);
        [result[i], result[j]] = [result[j], result[i]];
        if (local(i, j) < before) {
          changed = true;
          break;
        }
        [result[i], result[j]] = [result[j], result[i]]; // no better: put them back
      }
    }
    if (!changed) break;
  }
  return result;
}
