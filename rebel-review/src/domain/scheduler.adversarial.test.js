// src/domain/scheduler.adversarial.test.js
// Each test asserts what a ROBUST scheduler should do: either throw a clear Error
// (never a raw TypeError/RangeError) or return a card with a valid due date.
import { RATINGS, STATES, scheduleReview, isDue, getDueCards } from './scheduler';

const NOW = new Date('2026-01-01T12:00:00.000Z');

const base = () => ({
  id: 'c1',
  state: STATES.REVIEW,
  interval: 10,
  ease_factor: 2.5,
  repetitions: 3,
  due_at: NOW.toISOString(),
});

const run = (card, rating = RATINGS.GOOD, now = NOW, config) =>
  scheduleReview(card, rating, now, config);

// A result is "valid" if the due date parses and the numbers are finite.
function expectValidResult(result) {
  const { card } = result;
  expect(Number.isNaN(new Date(card.due_at).getTime())).toBe(false);
  expect(Number.isFinite(card.interval)).toBe(true);
  expect(Number.isFinite(card.ease_factor)).toBe(true);
  expect(Number.isFinite(card.repetitions)).toBe(true);
}

// Either throws a deliberate Error with a message, or returns a valid result.
// A raw TypeError/RangeError counts as a failure (it's an unhandled crash).
function expectGracefulOrValid(fn) {
  let result;
  try {
    result = fn();
  } catch (e) {
    expect(e.constructor).toBe(Error);
    expect(e.message.length).toBeGreaterThan(0);
    return;
  }
  expectValidResult(result);
}

describe('adversarial: bad cards', () => {
  test('01 null card gives a clear error, not a TypeError', () => {
    expectGracefulOrValid(() => run(null));
  });

  test('02 undefined ease_factor on a Review card', () => {
    const card = { ...base(), ease_factor: undefined };
    expectGracefulOrValid(() => run(card));
  });

  test('03 NaN interval', () => {
    const card = { ...base(), interval: NaN };
    expectGracefulOrValid(() => run(card));
  });

  test('04 string interval from JSON/localStorage ("10") must not concatenate', () => {
    const card = { ...base(), interval: '10' };
    const { card: out } = run(card);
    expect(out.interval).toBe(25); // 10 * 2.5, not "10"+1 = "101"
  });

  test('05 string ease_factor ("2.5") must not corrupt ease on Hard', () => {
    const card = { ...base(), ease_factor: '2.5' };
    expectGracefulOrValid(() => run(card, RATINGS.HARD));
  });

  test('06 negative interval must never schedule a due date in the past', () => {
    const card = { ...base(), interval: -50 };
    expectGracefulOrValid(() => {
      const result = run(card);
      expect(new Date(result.card.due_at).getTime()).toBeGreaterThan(NOW.getTime());
      return result;
    });
  });

  test('07 unknown state ("review" lowercase) is rejected, not treated as Learning', () => {
    const card = { ...base(), state: 'review' };
    expect(() => run(card)).toThrow(Error);
  });

  test('08 minimal card {state: "New"} produces finite repetitions', () => {
    expectGracefulOrValid(() => run({ id: 'c1', state: STATES.NEW }));
  });
});

describe('adversarial: extreme values', () => {
  test('09 huge interval is capped instead of overflowing the Date range', () => {
    const card = { ...base(), interval: 1e9 };
    expectGracefulOrValid(() => run(card, RATINGS.EASY));
  });

  test('10 absurd ease factor (1e6) does not overflow on Easy', () => {
    const card = { ...base(), ease_factor: 1e6 };
    expectGracefulOrValid(() => run(card, RATINGS.EASY));
  });

  test('11 100 consecutive Hard ratings keep ease at or above the 1.3 floor', () => {
    let card = base();
    for (let i = 0; i < 100; i++) {
      card = run(card, RATINGS.HARD).card;
    }
    expect(card.ease_factor).toBeGreaterThanOrEqual(1.3);
    expectValidResult({ card });
  });
});

describe('adversarial: bad inputs and config', () => {
  test('12 invalid `now` (Invalid Date) gives a clear error', () => {
    expectGracefulOrValid(() => run(base(), RATINGS.GOOD, new Date('nope')));
  });

  test('13 partial config is merged with defaults, not left as NaN', () => {
    expectGracefulOrValid(() => run(base(), RATINGS.GOOD, NOW, { startingEase: 3 }));
  });

  test('14 empty learning steps config gives a clear error or a valid result', () => {
    const newCard = { id: 'c1', state: STATES.NEW, interval: 0, ease_factor: 2.5, repetitions: 0 };
    const config = {
      startingEase: 2.5, minEase: 1.3, learningStepsMinutes: [],
      graduatingIntervalDays: 1, easyIntervalDays: 4, hardMultiplier: 1.2,
      easyBonus: 1.3, lapseEaseDelta: -0.2, hardEaseDelta: -0.15, easyEaseDelta: 0.15,
    };
    expectGracefulOrValid(() => run(newCard, RATINGS.AGAIN, NOW, config));
  });
});

describe('adversarial: helpers', () => {
  test('15 a card with a corrupt due_at is not silently treated as "never due"', () => {
    const corrupt = { ...base(), due_at: 'garbage' };
    expect(() => isDue(corrupt, NOW)).toThrow(Error);
  });

  test('16 getDueCards does not mutate the input array order', () => {
    const cards = [
      { ...base(), id: 'b', due_at: new Date(NOW.getTime() - 1000).toISOString() },
      { ...base(), id: 'a', due_at: new Date(NOW.getTime() - 99999).toISOString() },
    ];
    const before = cards.map((c) => c.id);
    getDueCards(cards, NOW);
    expect(cards.map((c) => c.id)).toEqual(before);
  });
});
