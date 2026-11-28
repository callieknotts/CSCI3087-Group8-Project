import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ApiError,
  getDeck,
  getSubdeck,
  listCards,
  listDecks,
  listStarredCardIds,
} from '../api/decksApi';
import { useLoad } from '../hooks/useLoad';
import { useStarred } from '../hooks/useStarred';
import { paths } from '../routes';
import { sideText } from '../utils/cardText';
import './FlashcardPage.css';

// Gets the cards to study, a title, and where the "back" link goes. There are three kinds:
//   /decks/:deckId/flashcards                  every card in the deck (all its subdecks)
//   /decks/:deckId/subdecks/:sid/flashcards    only that subdeck's cards
//   /flashcards/starred                        every card the user starred, from all decks
async function loadCards(deckId, subdeckId) {
  // starred cards: look through every deck (loadFlashcardSet keeps only the starred ones)
  if (!deckId) {
    const decks = await listDecks();
    const lists = await Promise.all(decks.map((deck) => listCards(deck.id)));
    return {
      title: 'Starred cards',
      backTo: paths.home,
      backLabel: 'Library',
      cards: lists.flat(),
    };
  }

  // one subdeck. The backend answers a missing subdeck with a 500, so say "not found" instead.
  if (subdeckId) {
    const [subdeck, cards] = await Promise.all([
      getSubdeck(deckId, subdeckId).catch((err) => {
        if (err.status === 500) throw new ApiError(404, 'That subdeck could not be found.');
        throw err;
      }),
      listCards(deckId, subdeckId),
    ]);
    return {
      title: subdeck.subdeckname,
      backTo: paths.subdeck(deckId, subdeckId),
      backLabel: 'Subdeck',
      cards,
    };
  }

  // a whole deck: the backend returns the cards of every subdeck, or just the deck's own
  // cards when it has no subdecks, so one request covers both cases
  const [deck, cards] = await Promise.all([getDeck(deckId), listCards(deckId)]);
  if (!deck) throw new ApiError(404, 'That deck could not be found.');
  return { title: deck.deckname, backTo: paths.deck(deckId), backLabel: 'Deck', cards };
}

// Loads the cards and the user's stars together, so each card's star starts out right.
async function loadFlashcardSet(deckId, subdeckId) {
  const [set, starred] = await Promise.all([loadCards(deckId, subdeckId), listStarredCardIds()]);
  return {
    ...set,
    starred,
    cards: deckId ? set.cards : set.cards.filter((card) => starred.has(card.id)),
  };
}

// The page: loads the cards, then shows the study screen (or a message if it cannot).
export default function FlashcardPage() {
  const { deckId, subdeckId } = useParams();

  const state = useLoad(
    () => loadFlashcardSet(deckId, subdeckId),
    `${deckId ?? 'starred'}/${subdeckId ?? ''}`,
  );

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

  const { title, backTo, backLabel, cards, starred } = state.data;

  if (cards.length === 0) {
    return (
      <main className="flash">
        <Link className="flash-back" to={backTo}>
          ← {backLabel}
        </Link>
        <h1 className="flash-title">{title}</h1>
        <p className="flash-message">
          {deckId
            ? 'There are no cards here yet, so there is nothing to study.'
            : "You haven't starred any cards yet. Star a card while studying to find it here."}
        </p>
      </main>
    );
  }

  return (
    <Flashcards
      title={title}
      backTo={backTo}
      backLabel={backLabel}
      cards={cards}
      initialStarred={starred}
    />
  );
}

// The study screen: one card at a time, flip it, move between cards, star it.
function Flashcards({ title, backTo, backLabel, cards, initialStarred }) {
  const [index, setIndex] = useState(0); // which card is showing
  const [flipped, setFlipped] = useState(false); // false = front, true = back
  const { starred, toggle, error: starError } = useStarred(initialStarred);
  const [instant, setInstant] = useState(false); // true for one frame: change cards without the flip animation

  const card = cards[index];
  const last = cards.length - 1;
  const isStarred = starred.has(card.id);

  // Flip the card (front <-> back as many times as wanted).
  const flip = useCallback(() => setFlipped((f) => !f), []);

  // Move to the previous (-1) or next (+1) card. A new card always starts on its front.
  const go = useCallback(
    (step) => {
      const target = index + step;
      if (target < 0 || target > last) return;
      setInstant(true); // a new card appears on its front straight away, without spinning
      setIndex(target);
      setFlipped(false);
    },
    [index, last],
  );

  // Turn the flip animation back on after the new card has been drawn.
  useEffect(() => {
    if (!instant) return undefined;
    const frame = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [instant]);

  // Star or un-star the current card (the backend remembers it).
  function toggleStar() {
    toggle(card);
  }

  // After a mouse click on a button, take focus off it. Otherwise the space bar would press
  // that same button again (for example un-star the card) instead of flipping the card.
  // A click made with the keyboard (detail 0) keeps its focus, so keyboard users can still
  // press buttons with space or Enter.
  function releaseFocusAfterMouseClick(event) {
    if (event.detail > 0) event.currentTarget.blur();
  }

  // Keyboard: space or up arrow flips, right arrow is next, left arrow is previous.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      // leave the keys alone while the person is typing (for example in the header search)
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (event.key === ' ') {
        // on a focused button or link the space bar should press it, not flip the card
        if (tag === 'BUTTON' || tag === 'A') return;
        event.preventDefault(); // stops the page from scrolling down
        flip();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        flip();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flip, go]);

  return (
    <main className="flash">
      <Link className="flash-back" to={backTo}>
        ← {backLabel}
      </Link>
      <h1 className="flash-title">{title}</h1>

      {/* bar showing how far through the cards you are */}
      <div
        className="flash-progress"
        role="progressbar"
        aria-label="Progress through the cards"
        aria-valuemin={1}
        aria-valuemax={cards.length}
        aria-valuenow={index + 1}
      >
        <span style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
      </div>

      {/* the stage holds the 3D space the card spins in, and the star on top of it */}
      <div className="flash-stage">
        {/* the card: click it to flip. It has two faces, and flipping spins it around. */}
        <div
          className={`flash-card${flipped ? ' flash-card--flipped' : ''}${instant ? ' flash-card--instant' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Card ${index + 1} of ${cards.length}, showing the ${flipped ? 'back' : 'front'}. Click to flip.`}
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

        {/* the star sits on the card's corner but is not part of the spinning card */}
        <button
          type="button"
          className={`flash-star${isStarred ? ' flash-star--on' : ''}`}
          aria-pressed={isStarred}
          aria-label={isStarred ? 'Remove star from this card' : 'Star this card'}
          onClick={(event) => {
            releaseFocusAfterMouseClick(event);
            toggleStar();
          }}
        >
          {isStarred ? '★' : '☆'}
        </button>
      </div>

      {/* shown only when the backend refused to save a star (the star went back) */}
      {starError && (
        <p className="flash-message" role="alert">
          {starError}
        </p>
      )}

      {/* previous button, "2 / 4", next button */}
      <div className="flash-nav">
        <button
          type="button"
          className="flash-arrow"
          aria-label="Previous card"
          onClick={(event) => {
            releaseFocusAfterMouseClick(event);
            go(-1);
          }}
          disabled={index === 0}
        >
          ←
        </button>
        <span className="flash-count">
          {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          className="flash-arrow"
          aria-label="Next card"
          onClick={(event) => {
            releaseFocusAfterMouseClick(event);
            go(1);
          }}
          disabled={index === last}
        >
          →
        </button>
      </div>

      <p className="flash-hint">Space or ↑ flips the card. ← and → move between cards.</p>
    </main>
  );
}
