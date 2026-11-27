import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { listReviewStates, submitReview } from '../api/decksApi';
import { useLoad } from '../hooks/useLoad';
import { paths } from '../routes';
import { sideText } from '../utils/cardText';
import { loadFlashcardSet } from '../utils/loadFlashcardSet';
import {
  RATINGS,
  buildQueue,
  countQueue,
  formatInterval,
  nextDueText,
} from '../utils/reviewSchedule';
import './FlashcardPage.css'; // the card, progress bar and page layout are the same as Classic mode
import './RepetitionPage.css';

// Repetition mode (spaced repetition). Routes:
//   /decks/:deckId/repetition                 the deck (all its subdecks)
//   /decks/:deckId/subdecks/:sid/repetition   one subdeck
// The page loads the cards plus the user's review states, studies the cards that are due and
// the new ones, and sends each rating to the backend, which schedules the card's next review.
export default function RepetitionPage() {
  const { deckId, subdeckId } = useParams();
  const { user } = useOutletContext();

  const state = useLoad(async () => {
    const [set, reviews] = await Promise.all([
      loadFlashcardSet(deckId, subdeckId, user?.id),
      listReviewStates(),
    ]);
    return {
      ...set,
      states: new Map(reviews.states.map((s) => [s.card_id, s])),
      newCardIntervals: reviews.new_card_intervals,
    };
  }, `repetition/${deckId}/${subdeckId ?? ''}`);

  if (state.status === 'loading') {
    return (
      <main className="flash">
        <p className="flash-message">Loading cards…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="flash">
        <div className="flash-message" role="alert">
          <p>{state.message}</p>
          <button type="button" className="btn btn-type2" onClick={state.retry}>
            Try again
          </button>{' '}
          <Link className="btn btn-type2" to={paths.home}>
            Back to the library
          </Link>
        </div>
      </main>
    );
  }

  const { title, backTo, backLabel, cards, states, newCardIntervals } = state.data;

  if (cards.length === 0) {
    return (
      <main className="flash">
        <Link className="flash-back" to={backTo}>
          ← {backLabel}
        </Link>
        <h1 className="flash-title">{title}</h1>
        <p className="flash-message">There are no cards here yet, so there is nothing to study.</p>
      </main>
    );
  }

  return (
    <Review
      title={title}
      backTo={backTo}
      backLabel={backLabel}
      cards={cards}
      initialStates={states}
      newCardIntervals={newCardIntervals}
    />
  );
}

// The study screen: one card at a time. Flip it, then say how well you knew it.
function Review({ title, backTo, backLabel, cards, initialStates, newCardIntervals }) {
  const { onUnauthorized } = useOutletContext();
  const [states, setStates] = useState(initialStates); // card id -> review state, kept up to date
  const [queue, setQueue] = useState(() => buildQueue(cards, initialStates));
  const [flipped, setFlipped] = useState(false);
  const [instant, setInstant] = useState(false); // true for one frame: change cards without the flip animation
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ reviewed: 0, again: 0 });

  const card = queue[0]; // undefined once the session is finished

  const flip = useCallback(() => setFlipped((f) => !f), []);

  // Send the rating, then move on. "Again" puts the card back at the end of this session's queue
  // so it comes round once more; any other rating takes it out until the backend says it is due.
  const rate = useCallback(
    async (rating) => {
      if (!card || !flipped || submitting) return;
      setSubmitting(true);
      setError('');
      try {
        const updated = await submitReview(card.id, rating);
        setStates((prev) => new Map(prev).set(card.id, updated));
        setStats((prev) => ({
          reviewed: prev.reviewed + 1,
          again: prev.again + (rating === 'again' ? 1 : 0),
        }));
        setInstant(true); // the next card appears on its front straight away, without spinning
        setFlipped(false);
        setQueue(([first, ...rest]) => (rating === 'again' ? [...rest, first] : rest));
      } catch (err) {
        if (err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err.message); // the card stays put, so the same rating can be tried again
      } finally {
        setSubmitting(false);
      }
    },
    [card, flipped, submitting, onUnauthorized],
  );

  // Turn the flip animation back on after the new card has been drawn.
  useEffect(() => {
    if (!instant) return undefined;
    const frame = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [instant]);

  // Keyboard: space or up arrow flips; once flipped, 1-4 rate and space means "Good".
  useEffect(() => {
    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      // leave the keys alone while the person is typing (for example in the header search)
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (event.key === ' ') {
        // on a focused button or link the space bar should press it
        if (tag === 'BUTTON' || tag === 'A') return;
        event.preventDefault(); // stops the page from scrolling down
        if (flipped) rate('good');
        else flip();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        flip();
      } else {
        const rating = RATINGS.find((r) => r.key === event.key);
        if (rating && flipped) rate(rating.value);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flip, rate, flipped]);

  // After a mouse click on a button, take focus off it so the space bar flips the card
  // instead of pressing that same button again (same as Classic mode).
  function releaseFocusAfterMouseClick(event) {
    if (event.detail > 0) event.currentTarget.blur();
  }

  // Nothing left: either the session is finished, or nothing was due to begin with.
  if (!card) {
    const next = nextDueText(cards, states);
    const retained = stats.reviewed
      ? Math.round(((stats.reviewed - stats.again) / stats.reviewed) * 100)
      : 100;
    return (
      <main className="flash rep">
        <Link className="flash-back" to={backTo}>
          ← {backLabel}
        </Link>
        <h1 className="flash-title">{title}</h1>
        <div className="flash-message" role="status">
          <p>
            <strong>{stats.reviewed ? 'Session complete!' : "You're all caught up."}</strong>
          </p>
          {stats.reviewed > 0 && (
            <p>
              {stats.reviewed} {stats.reviewed === 1 ? 'review' : 'reviews'} · {retained}% answered
              without Again
            </p>
          )}
          <p>{next ? `Next card due ${next}.` : 'No cards are scheduled yet.'}</p>
        </div>
      </main>
    );
  }

  const counts = countQueue(queue, states);

  // when this card returns for each rating, as worked out by the backend
  const intervals = states.get(card.id)?.next_intervals ?? newCardIntervals;
  const done = stats.reviewed;
  const total = done + queue.length;

  return (
    <main className="flash rep">
      <Link className="flash-back" to={backTo}>
        ← {backLabel}
      </Link>
      <h1 className="flash-title">{title}</h1>

      {/* bar showing how far through this session you are */}
      <div
        className="flash-progress"
        role="progressbar"
        aria-label="Progress through this session"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <span style={{ width: `${(done / total) * 100}%` }} />
      </div>

      {/* how many cards are left of each kind */}
      <div className="rep-counts" aria-label="Cards left in this session">
        <span className="rep-count rep-count--new">New {counts.new}</span>
        <span className="rep-count rep-count--learn">Learn {counts.learn}</span>
        <span className="rep-count rep-count--review">Due {counts.due}</span>
      </div>

      <div className="flash-stage">
        <div
          className={`flash-card${flipped ? ' flash-card--flipped' : ''}${instant ? ' flash-card--instant' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Card, showing the ${flipped ? 'back' : 'front'}. Click to flip.`}
          onClick={flip}
          onKeyDown={(event) => {
            if (event.key === 'Enter') flip();
          }}
        >
          <div className="flash-face flash-face--front" aria-hidden={flipped}>
            <span className="flash-side">Front</span>
            <p className="flash-text">{sideText(card.content?.front)}</p>
          </div>
          <div className="flash-face flash-face--back" aria-hidden={!flipped}>
            <span className="flash-side">Back</span>
            <p className="flash-text">{sideText(card.content?.back)}</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="rep-error" role="alert">
          {error}
        </p>
      )}

      {/* before flipping: one button. After flipping: how well did you know it? */}
      {flipped ? (
        <div className="rep-rate" role="group" aria-label="How well did you know it?">
          {RATINGS.map((rating) => (
            <button
              key={rating.value}
              type="button"
              className={`rep-rate-button rep-rate-button--${rating.value}`}
              disabled={submitting}
              onClick={(event) => {
                releaseFocusAfterMouseClick(event);
                rate(rating.value);
              }}
            >
              {rating.label}
              <small>{formatInterval(intervals[rating.value])}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="rep-reveal">
          <button
            type="button"
            className="btn btn-type1"
            onClick={(event) => {
              releaseFocusAfterMouseClick(event);
              flip();
            }}
          >
            Show answer
          </button>
        </div>
      )}

      <p className="flash-hint">
        Space or ↑ flips the card. After flipping: 1 Again, 2 Hard, 3 Good, 4 Easy (Space = Good).
      </p>
    </main>
  );
}
