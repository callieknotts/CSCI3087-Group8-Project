// src/domain/scheduleReview.test.js
import { RATINGS, STATES, scheduleReview } from './scheduler';

const NOW = new Date('2026-01-01T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const reviewCard = {
  id: 'c1',
  state: STATES.REVIEW,
  interval: 10,
  ease_factor: 2.5,
  repetitions: 3,
  due_at: NOW.toISOString(),
};

test('Good on a New card graduates it to Review, due in 1 day', () => {
  const newCard = {
    id: 'c1',
    state: STATES.NEW,
    interval: 0,
    ease_factor: 2.5,
    repetitions: 0,
    due_at: NOW.toISOString(),
  };

  const { card } = scheduleReview(newCard, RATINGS.GOOD, NOW);

  expect(card.state).toBe(STATES.REVIEW);
  expect(card.interval).toBe(1);
  expect(card.repetitions).toBe(1);
  expect(new Date(card.due_at).getTime()).toBe(NOW.getTime() + DAY_MS);
});

test('Again on a Review card lapses it: back to Learning, ease lowered, reps reset', () => {
  const { card, review } = scheduleReview(reviewCard, RATINGS.AGAIN, NOW);

  expect(card.state).toBe(STATES.LEARNING);
  expect(card.repetitions).toBe(0);
  expect(card.interval).toBe(0);
  expect(card.ease_factor).toBe(2.3);
  expect(new Date(card.due_at).getTime() - NOW.getTime()).toBeLessThan(DAY_MS);
  expect(review).toMatchObject({ rating: RATINGS.AGAIN, old_interval: 10, new_interval: 0 });
});

test('harder ratings produce shorter intervals than easier ones', () => {
  const interval = (rating) => scheduleReview(reviewCard, rating, NOW).card.interval;

  const again = interval(RATINGS.AGAIN);
  const hard = interval(RATINGS.HARD);
  const good = interval(RATINGS.GOOD);
  const easy = interval(RATINGS.EASY);

  expect(again).toBeLessThan(hard);
  expect(hard).toBeLessThan(good);
  expect(good).toBeLessThan(easy);
});
