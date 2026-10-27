// AI GENERATED CODE FROM CLASS ACTIVITY 
// src/domain/scheduler.js
// Pure scheduling logic: no UI, storage, or framework imports (onion architecture: domain layer).

export const RATINGS = Object.freeze({
  AGAIN: 'Again',
  HARD: 'Hard',
  GOOD: 'Good',
  EASY: 'Easy',
});

export const STATES = Object.freeze({
  NEW: 'New',
  LEARNING: 'Learning',
  REVIEW: 'Review',
});

export const DEFAULT_CONFIG = Object.freeze({
  startingEase: 2.5,
  minEase: 1.3,
  learningStepsMinutes: [1, 10], // short re-show delays while a card is being learned
  graduatingIntervalDays: 1,     // Good on a learning card
  easyIntervalDays: 4,           // Easy on a learning card
  maxIntervalDays: 36500,        // cap (~100 years) so dates can never overflow
  hardMultiplier: 1.2,
  easyBonus: 1.3,
  lapseEaseDelta: -0.2,
  hardEaseDelta: -0.15,
  easyEaseDelta: 0.15,
});

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function clampEase(ease, config) {
  // round to 2 decimals to avoid floating-point drift across many reviews
  return Math.max(config.minEase, Math.round(ease * 100) / 100);
}

/**
 * Returns the initial scheduling fields for a brand-new card.
 * Spread this into createCard() in domain/card.js.
 */
export function newCardSchedule(now = new Date(), config = DEFAULT_CONFIG) {
  return {      //everything in the {} is an object being returned
    state: STATES.NEW,
    due_at: now.toISOString(),
    interval: 0,
    ease_factor: config.startingEase,
    repetitions: 0,
  };
}

/** True when the card's due date has arrived. */
export function isDue(card, now = new Date()) {
  const due = new Date(card.due_at).getTime();
  if (Number.isNaN(due)) {
    throw new Error(`Card ${card.id} has an invalid due_at: ${card.due_at}`);
  }
  return due <= now.getTime();
}

/** Returns due cards, most overdue first (ties broken by id for determinism). */
export function getDueCards(cards, now = new Date()) {
  return cards
    .filter((card) => isDue(card, now))
    .sort((a, b) => {
      const diff = new Date(a.due_at) - new Date(b.due_at);
      return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
    });
}

/**
 * Applies a rating to a card.
 *
 * Returns { card, review }:
 *   card   - the updated card (the input is never mutated)
 *   review - a record matching the ERD's Review entity (minus id/card_id/response_time)
 *
 * Deterministic: the same (card, rating, now, config) always gives the same result.
 */
export function scheduleReview(card, rating, now = new Date(), config = DEFAULT_CONFIG) {
  if (!Object.values(RATINGS).includes(rating)) {
    throw new Error(`Invalid rating: ${rating}`);
  }
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('Invalid "now": expected a valid Date');
  }
  const cfg = normalizeConfig(config);
  const safeCard = normalizeCard(card, cfg);

  const next =
    safeCard.state === STATES.REVIEW
      ? scheduleReviewCard(safeCard, rating, now, cfg)
      : scheduleLearningCard(safeCard, rating, now, cfg);

  const updatedCard = { ...safeCard, ...next };
  updatedCard.interval = Math.min(updatedCard.interval, cfg.maxIntervalDays);

  return {
    card: updatedCard,
    review: {
      card_id: safeCard.id,
      rating,
      reviewed_at: now.toISOString(),
      old_interval: safeCard.interval,
      new_interval: updatedCard.interval,
    },
  };
}

// Merge partial configs with defaults and reject unusable values.
function normalizeConfig(config) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  if (!Array.isArray(cfg.learningStepsMinutes) || cfg.learningStepsMinutes.length === 0 ||
      !cfg.learningStepsMinutes.every((m) => Number.isFinite(m) && m > 0)) {
    throw new Error('Invalid config: learningStepsMinutes must be a non-empty array of positive numbers');
  }
  return cfg;
}

// Validate and coerce a card from untrusted storage (JSON, localStorage, API).
function normalizeCard(card, cfg) {
  if (card === null || typeof card !== 'object') {
    throw new Error('Invalid card: expected an object');
  }
  if (!Object.values(STATES).includes(card.state)) {
    throw new Error(`Invalid card state: ${card.state}`);
  }
  const isReview = card.state === STATES.REVIEW;
  return {
    ...card,
    interval: toNumber(card.interval, 'interval', isReview ? undefined : 0, { min: 0 }),
    ease_factor: toNumber(card.ease_factor, 'ease_factor', isReview ? undefined : cfg.startingEase, { min: 0.01 }),
    repetitions: toNumber(card.repetitions, 'repetitions', 0, { min: 0 }),
  };
}

// Accepts numbers and numeric strings ("10"); rejects NaN, Infinity, and out-of-range values.
function toNumber(value, name, fallback, { min }) {
  if (value === undefined || value === null || value === '') {
    if (fallback === undefined) throw new Error(`Invalid card: ${name} is required`);
    return fallback;
  }
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min) {
    throw new Error(`Invalid card: ${name} must be a finite number >= ${min}, got ${value}`);
  }
  return n;
}

// New or Learning cards: short minute-based steps until the card "graduates" to Review.
function scheduleLearningCard(card, rating, now, config) {
  const steps = config.learningStepsMinutes;
  const firstStep = steps[0];
  const secondStep = steps[Math.min(1, steps.length - 1)];

  switch (rating) {
    case RATINGS.AGAIN:
      return {
        state: STATES.LEARNING,
        repetitions: 0,
        interval: 0,
        due_at: addMinutes(now, firstStep).toISOString(),
      };
    case RATINGS.HARD:
      return {
        state: STATES.LEARNING,
        interval: 0,
        due_at: addMinutes(now, secondStep).toISOString(),
      };
    case RATINGS.GOOD:
      return graduate(card, config.graduatingIntervalDays, now, config);
    case RATINGS.EASY:
      return graduate(card, config.easyIntervalDays, now, config);
    default:
      throw new Error(`Unhandled rating: ${rating}`);
  }
}

function graduate(card, intervalDays, now, config) {
  return {
    state: STATES.REVIEW,
    repetitions: card.repetitions + 1,
    interval: intervalDays,
    ease_factor: card.ease_factor ?? config.startingEase,
    due_at: addDays(now, intervalDays).toISOString(),
  };
}

// Review cards: day-based intervals that grow with the ease factor.
function scheduleReviewCard(card, rating, now, config) {
  const { interval, ease_factor: ease } = card;

  switch (rating) {
    case RATINGS.AGAIN: {
      // Lapse: relearn the card and make it harder to grow next time.
      return {
        state: STATES.LEARNING,
        repetitions: 0,
        interval: 0,
        ease_factor: clampEase(ease + config.lapseEaseDelta, config),
        due_at: addMinutes(now, config.learningStepsMinutes[0]).toISOString(),
      };
    }
    case RATINGS.HARD: {
      // Always move forward by at least one day so Hard never stalls or shrinks the schedule.
      const next = Math.max(interval + 1, Math.round(interval * config.hardMultiplier));
      return reviewResult(card, next, clampEase(ease + config.hardEaseDelta, config), now, config);
    }
    case RATINGS.GOOD: {
      const next = Math.max(interval + 1, Math.round(interval * ease));
      return reviewResult(card, next, ease, now, config);
    }
    case RATINGS.EASY: {
      const next = Math.max(interval + 1, Math.round(interval * ease * config.easyBonus));
      return reviewResult(card, next, clampEase(ease + config.easyEaseDelta, config), now, config);
    }
    default:
      throw new Error(`Unhandled rating: ${rating}`);
  }
}

function reviewResult(card, rawIntervalDays, ease, now, config) {
  const intervalDays = Math.min(rawIntervalDays, config.maxIntervalDays);
  return {
    state: STATES.REVIEW,
    repetitions: card.repetitions + 1,
    interval: intervalDays,
    ease_factor: ease,
    due_at: addDays(now, intervalDays).toISOString(),
  };
}