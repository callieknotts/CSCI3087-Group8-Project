// Helpers for Repetition mode (spaced repetition).
//
// The scheduling rules (how long until a card returns) live ONLY in the backend
// (backend/use_case/review/reviewSheduler.py). The backend sends the next interval for each
// rating with every review state, and this page just shows them. What is here only decides
// which cards to study and how to write an interval.

export const RATINGS = [
  { value: 'again', label: 'Again', key: '1' },
  { value: 'hard', label: 'Hard', key: '2' },
  { value: 'good', label: 'Good', key: '3' },
  { value: 'easy', label: 'Easy', key: '4' },
];

// how many never-reviewed cards one session starts with (a per-day limit can replace this later)
export const NEW_CARD_LIMIT = 20;

const DAY_MS = 86_400_000;

// 0.007 -> "10m", 0.5 -> "12h", 1 -> "1d", 7.5 -> "8d", 45 -> "1.5mo"
export function formatInterval(days) {
  const minutes = Math.round(days * 1440);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.round(days * 24);
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${Math.round(days)}d`;
  return `${(days / 30).toFixed(1)}mo`;
}

// 'new' (never reviewed), 'learn' (interval under a day, e.g. after Again) or 'review'.
export function cardKind(state) {
  if (!state) return 'new';
  return state.interval_days < 1 ? 'learn' : 'review';
}

// The backend sends UTC times; read one with no zone as UTC rather than local time.
function dueTime(state) {
  const text = String(state.due_at);
  return new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(text) ? text : `${text}Z`).getTime();
}

// The cards to study now: cards that are due (earliest first), then never-reviewed cards.
// states: Map of card id -> review state. Cards scheduled for later are left out.
export function buildQueue(cards, states, now = Date.now(), newLimit = NEW_CARD_LIMIT) {
  const due = cards
    .filter((card) => states.has(card.id) && dueTime(states.get(card.id)) <= now)
    .sort((a, b) => dueTime(states.get(a.id)) - dueTime(states.get(b.id)));
  const fresh = cards.filter((card) => !states.has(card.id)).slice(0, newLimit);
  return [...due, ...fresh];
}

// How many cards of each kind are in a queue: { new, learn, due }.
//   new    never reviewed
//   learn  being relearned (interval under a day, for example after Again) and due now
//   due    cards in review that are due now
export function countQueue(queue, states) {
  const counts = { new: 0, learn: 0, due: 0 };
  for (const card of queue) {
    const kind = cardKind(states.get(card.id));
    counts[kind === 'review' ? 'due' : kind] += 1;
  }
  return counts;
}

// The numbers shown for a deck or subdeck in the library: what Repetition mode would
// start with if it was opened now.
export function countCards(cards, states, now = Date.now(), newLimit = NEW_CARD_LIMIT) {
  return countQueue(buildQueue(cards, states, now, newLimit), states);
}

// "in 10m", "in 3d" ... for the soonest card that is not due yet, or null if there is none.
export function nextDueText(cards, states, now = Date.now()) {
  let soonest = null;
  for (const card of cards) {
    const state = states.get(card.id);
    if (!state) continue;
    const time = dueTime(state);
    if (time > now && (soonest === null || time < soonest)) soonest = time;
  }
  return soonest === null ? null : `in ${formatInterval((soonest - now) / DAY_MS)}`;
}
